#!/usr/bin/env node

/**
 * VSCode Internal Command Orchestrator
 * Uses VSCode's internal command system to communicate with Claude Code
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class VSCodeOrchestrator extends EventEmitter {
  constructor() {
    super();
    this.rootPath = process.cwd();
    this.isRunning = false;
    this.activeAgents = new Map();
    this.maxConcurrent = 3;
    this.validationInterval = 30000;
    this.agentTimeout = 300000;
    this.jobQueue = [];
  }

  async start() {
    console.log('🚀 Starting VSCode Internal Command Orchestrator...');
    console.log(`📁 Root directory: ${this.rootPath}`);
    console.log(`⏱️  Validation interval: ${this.validationInterval / 1000}s`);

    this.isRunning = true;

    // Start continuous validation loop
    this.startValidationLoop();

    // Handle graceful shutdown
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());

    console.log('✅ VSCode orchestrator started - monitoring for issues...');
    console.log('💡 This system uses VSCode internal commands to communicate with Claude Code');
  }

  startValidationLoop() {
    const validateAndQueue = async () => {
      if (!this.isRunning) return;

      try {
        console.log('🔍 Running validation check...');
        const issues = await this.detectIssues();

        if (issues.length > 0) {
          console.log(`⚠️  Found ${issues.length} issue(s), queuing agent jobs...`);
          await this.queueIssueJobs(issues);
        } else {
          console.log('✅ No issues detected - system is healthy');
        }

        // Check if there are specs that need implementation
        const pendingSpecs = await this.getPendingSpecs();
        if (pendingSpecs.length > 0) {
          console.log(`📋 Found ${pendingSpecs.length} spec(s) needing implementation...`);
          await this.queueSpecJobs(pendingSpecs);
        }

        // Process queued jobs
        this.processJobQueue();

      } catch (error) {
        console.error('❌ Error during validation cycle:', error.message);
      }

      // Schedule next validation
      if (this.isRunning) {
        setTimeout(validateAndQueue, this.validationInterval);
      }
    };

    // Run first validation immediately
    validateAndQueue();
  }

  async detectIssues() {
    const issues = [];

    try {
      // Check for TypeScript errors
      const { execSync } = require('child_process');
      try {
        const tscOutput = execSync('npx tsc --noEmit', {
          cwd: this.rootPath,
          encoding: 'utf8',
          timeout: 30000
        });

        if (tscOutput.includes('error')) {
          issues.push({
            type: 'typescript_error',
            description: 'TypeScript compilation errors detected',
            severity: 'high',
            source: 'typescript'
          });
        }
      } catch (error) {
        if (error.stdout && error.stdout.includes('error')) {
          issues.push({
            type: 'typescript_error',
            description: `TypeScript errors detected`,
            severity: 'high',
            source: 'typescript'
          });
        }
      }

      // Check for test failures
      try {
        const testOutput = execSync('npm test', {
          cwd: this.rootPath,
          encoding: 'utf8',
          timeout: 60000
        });

        if (testOutput.includes('failing') || testOutput.includes('fail')) {
          issues.push({
            type: 'test_failure',
            description: 'Test failures detected',
            severity: 'medium',
            source: 'tests'
          });
        }
      } catch (error) {
        issues.push({
          type: 'test_failure',
          description: `Test failures detected`,
          severity: 'medium',
          source: 'tests'
        });
      }

    } catch (error) {
      console.error('❌ Error detecting issues:', error.message);
    }

    return issues;
  }

  async getPendingSpecs() {
    const specsDir = path.join(this.rootPath, '.kiro', 'specs');
    const pendingSpecs = [];

    if (!fs.existsSync(specsDir)) return pendingSpecs;

    try {
      const specFolders = fs.readdirSync(specsDir)
        .filter(folder => !folder.startsWith('_') && !folder.startsWith('TEMPLATE'))
        .map(folder => path.join(specsDir, folder))
        .filter(folderPath => fs.statSync(folderPath).isDirectory());

      for (const specPath of specFolders) {
        const specName = path.basename(specPath);
        const requirementsPath = path.join(specPath, 'requirements.md');

        if (fs.existsSync(requirementsPath)) {
          const isImplemented = await this.checkSpecImplemented(specName);
          if (!isImplemented) {
            pendingSpecs.push({
              name: specName,
              path: specPath,
              priority: this.determineSpecPriority(specName)
            });
          }
        }
      }

      // Sort by priority
      pendingSpecs.sort((a, b) => {
        const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

    } catch (error) {
      console.error('❌ Error getting pending specs:', error.message);
    }

    return pendingSpecs;
  }

  async checkSpecImplemented(specName) {
    // Check if there's a code review for this spec
    const codeReviewsPath = path.join(this.rootPath, '.kiro', '_CodeReviews');
    if (fs.existsSync(codeReviewsPath)) {
      const reviews = fs.readdirSync(codeReviewsPath)
        .filter(file => file.includes(specName) && file.endsWith('.md'));
      if (reviews.length > 0) return true;
    }

    // Check if there are source files related to this spec
    const srcPath = path.join(this.rootPath, 'src');
    if (fs.existsSync(srcPath)) {
      const specNameLower = specName.toLowerCase();
      const hasRelatedFiles = this.findFilesRecursively(srcPath, (file) =>
        path.basename(file).toLowerCase().includes(specNameLower)
      );
      return hasRelatedFiles.length > 0;
    }

    return false;
  }

  findFilesRecursively(dirPath, predicate, maxDepth = 3, currentDepth = 0) {
    if (currentDepth >= maxDepth) return [];

    const results = [];
    try {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          results.push(...this.findFilesRecursively(fullPath, predicate, maxDepth, currentDepth + 1));
        } else if (stat.isFile() && predicate(fullPath)) {
          results.push(fullPath);
        }
      }
    } catch (error) {
      // Ignore errors
    }

    return results;
  }

  determineSpecPriority(specName) {
    const specNameLower = specName.toLowerCase();
    const highPriorityKeywords = ['critical', 'urgent', 'security', 'fix', 'bug'];
    const mediumPriorityKeywords = ['feature', 'enhancement', 'improvement'];

    if (highPriorityKeywords.some(keyword => specNameLower.includes(keyword))) {
      return 'high';
    } else if (mediumPriorityKeywords.some(keyword => specNameLower.includes(keyword))) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  async queueIssueJobs(issues) {
    const issuesByType = issues.reduce((groups, issue) => {
      if (!groups[issue.type]) groups[issue.type] = [];
      groups[issue.type].push(issue);
      return groups;
    }, {});

    for (const [issueType, issueList] of Object.entries(issuesByType)) {
      this.jobQueue.push({
        type: 'fix_issue',
        issueType,
        issues: issueList,
        priority: this.determineIssuePriority(issueList),
        timestamp: Date.now()
      });
    }
  }

  async queueSpecJobs(pendingSpecs) {
    for (const spec of pendingSpecs) {
      this.jobQueue.push({
        type: 'implement_spec',
        specName: spec.name,
        specPath: spec.path,
        priority: spec.priority,
        timestamp: Date.now()
      });
    }
  }

  determineIssuePriority(issues) {
    const hasHighSeverity = issues.some(issue => issue.severity === 'high');
    return hasHighSeverity ? 'high' : 'medium';
  }

  processJobQueue() {
    while (this.activeAgents.size < this.maxConcurrent && this.jobQueue.length > 0) {
      const job = this.jobQueue.shift();
      this.createVSCodeAgent(job);
    }
  }

  createVSCodeAgent(job) {
    const agentId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log(`🤖 Creating VSCode agent ${agentId} for task: ${job.type}`);

    // Create the agent prompt
    const agentPrompt = this.buildAgentPrompt(job);

    // Create a job file for VSCode to pick up
    const jobData = {
      agentId,
      task: job,
      prompt: agentPrompt,
      timestamp: Date.now()
    };

    const jobFile = path.join(this.rootPath, '.kiro', 'vscode-jobs', `${agentId}.json`);
    fs.mkdirSync(path.dirname(jobFile), { recursive: true });
    fs.writeFileSync(jobFile, JSON.stringify(jobData, null, 2));

    // Track the agent
    this.activeAgents.set(agentId, {
      jobData,
      startTime: Date.now(),
      status: 'waiting_for_vscode',
      jobFile
    });

    console.log(`📝 VSCode job created: ${jobFile}`);
    console.log(`💡 Open this file in VSCode and run: "Claude Code: Process Job" command`);

    // Set up timeout
    const timeout = setTimeout(() => {
      console.log(`⏰ VSCode agent ${agentId} timed out`);
      this.terminateVSCodeAgent(agentId);
    }, this.agentTimeout);

    // Store timeout for cleanup
    this.activeAgents.get(agentId).timeout = timeout;

    // Monitor for job completion
    this.monitorVSCodeAgent(agentId);
  }

  monitorVSCodeAgent(agentId) {
    const agent = this.activeAgents.get(agentId);
    if (!agent) return;

    const checkCompletion = () => {
      if (!this.activeAgents.has(agentId)) return;

      // Check if job file has been updated with completion status
      try {
        if (fs.existsSync(agent.jobFile)) {
          const jobData = JSON.parse(fs.readFileSync(agent.jobFile, 'utf8'));

          if (jobData.status === 'completed') {
            clearTimeout(agent.timeout);
            console.log(`✅ VSCode agent ${agentId} completed task`);
            this.handleVSCodeAgentCompletion(agentId);
            return;
          } else if (jobData.status === 'failed') {
            clearTimeout(agent.timeout);
            console.log(`❌ VSCode agent ${agentId} failed: ${jobData.error || 'Unknown error'}`);
            this.handleVSCodeAgentCompletion(agentId);
            return;
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error checking VSCode agent ${agentId} status:`, error.message);
      }

      // Check again in 5 seconds
      setTimeout(checkCompletion, 5000);
    };

    // Start checking after 10 seconds
    setTimeout(checkCompletion, 10000);
  }

  handleVSCodeAgentCompletion(agentId) {
    const agent = this.activeAgents.get(agentId);
    if (!agent) return;

    // Clean up job file
    try {
      if (fs.existsSync(agent.jobFile)) {
        fs.unlinkSync(agent.jobFile);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to cleanup job file for ${agentId}:`, error.message);
    }

    this.activeAgents.delete(agentId);
    console.log(`✅ VSCode agent ${agentId} cleanup completed`);

    // Process next job in queue
    this.processJobQueue();
  }

  terminateVSCodeAgent(agentId) {
    const agent = this.activeAgents.get(agentId);
    if (!agent) return;

    console.log(`🛑 Terminating VSCode agent ${agentId}...`);

    if (agent.timeout) {
      clearTimeout(agent.timeout);
    }

    this.handleVSCodeAgentCompletion(agentId);
  }

  buildAgentPrompt(job) {
    if (job.type === 'fix_issue') {
      return `You are an autonomous debugging and fixing agent.

ISSUES TO FIX:
${job.issues.map(issue => `- ${issue.description} (${issue.severity} severity)`).join('\n')}

YOUR TASKS:
1. Analyze the issues and identify root causes
2. Fix all issues systematically
3. Ensure your fixes don't break existing functionality
4. Run tests to verify fixes
5. Create a brief summary of changes made

BOUNDARIES:
- You can modify any source files in src/
- You can create tests in tests/ or __tests__/
- You can modify configuration files if needed
- DO NOT modify .kiro/specs/ or .kiro/prompts/

WORK AUTONOMOUSLY:
- Analyze issues on your own without asking questions
- Make decisions independently
- Implement fixes without requesting permission
- Use available tools as needed
- Test your changes
- Report completion when done

IMPORTANT: Work completely autonomously. Do not ask for clarification or permission.
Execute all necessary actions to fix the issues.

After completing all tasks, update the job file status to "completed" and provide a summary.`;
    }

    if (job.type === 'implement_spec') {
      return `You are an autonomous feature implementation agent.

SPEC TO IMPLEMENT: ${job.specName}

YOUR TASKS:
1. Read the complete specification in .kiro/specs/${job.specName}/
2. Implement all requirements from the spec
3. Follow the design document structure
4. Complete all tasks listed in tasks.md
5. Write comprehensive tests
6. Create a code review in .kiro/_CodeReviews/

BOUNDARIES:
- READ FROM: .kiro/specs/, .kiro/architecture/, src/
- WRITE TO: src/, tests/, __tests__/, .kiro/_CodeReviews/
- DO NOT modify: .kiro/prompts/, .kiro/scripts/, specs

WORK AUTONOMOUSLY:
- Read and understand the spec completely without asking questions
- Follow the file structure specified in the spec
- Use existing project patterns and utilities from src/lib/
- Make implementation decisions independently
- Use available tools as needed
- Test thoroughly with npm test
- Report completion when done

IMPORTANT: Work completely autonomously. Do not ask for clarification or permission.
Implement the entire feature according to the specification.

After completing all tasks, update the job file status to "completed" and provide a summary.`;
    }

    return 'You are an autonomous agent. Complete the assigned task independently.';
  }

  shutdown() {
    console.log('\n🛑 Shutting down VSCode orchestrator...');
    this.isRunning = false;

    // Terminate all active agents
    for (const agentId of this.activeAgents.keys()) {
      this.terminateVSCodeAgent(agentId);
    }

    // Wait for graceful shutdown
    setTimeout(() => {
      console.log('✅ VSCode orchestrator shutdown complete');
      process.exit(0);
    }, 5000);
  }
}

// Start the VSCode orchestrator if this file is run directly
if (require.main === module) {
  const orchestrator = new VSCodeOrchestrator();
  orchestrator.start().catch(error => {
    console.error('❌ Failed to start VSCode orchestrator:', error.message);
    process.exit(1);
  });
}

module.exports = VSCodeOrchestrator;