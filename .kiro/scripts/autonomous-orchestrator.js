#!/usr/bin/env node

/**
 * Autonomous Coder Agent Orchestrator
 * Automatically detects issues and runs coder agents to fix them
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const { EventEmitter } = require('events');

class AutonomousOrchestrator extends EventEmitter {
  constructor() {
    super();
    this.rootPath = process.cwd();
    this.isRunning = false;
    this.activeAgents = new Map();
    this.maxConcurrent = 3;
    this.validationInterval = 30000; // Check every 30 seconds
    this.agentTimeout = 300000; // 5 minutes per agent
  }

  async start() {
    console.log('🚀 Starting Autonomous Coder Agent Orchestrator...');
    console.log(`📁 Root directory: ${this.rootPath}`);
    console.log(`⏱️  Validation interval: ${this.validationInterval / 1000}s`);

    this.isRunning = true;

    // Start continuous validation loop
    this.startValidationLoop();

    // Handle graceful shutdown
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());

    console.log('✅ Autonomous orchestrator started - monitoring for issues...');
  }

  startValidationLoop() {
    const validateAndFix = async () => {
      if (!this.isRunning) return;

      try {
        console.log('🔍 Running validation check...');
        const issues = await this.detectIssues();

        if (issues.length > 0) {
          console.log(`⚠️  Found ${issues.length} issue(s), launching coder agents...`);
          await this.handleIssues(issues);
        } else {
          console.log('✅ No issues detected - system is healthy');
        }

        // Check if there are specs that need implementation
        const pendingSpecs = await this.getPendingSpecs();
        if (pendingSpecs.length > 0) {
          console.log(`📋 Found ${pendingSpecs.length} spec(s) needing implementation...`);
          await this.handlePendingSpecs(pendingSpecs);
        }

      } catch (error) {
        console.error('❌ Error during validation cycle:', error.message);
      }

      // Schedule next validation
      if (this.isRunning) {
        setTimeout(validateAndFix, this.validationInterval);
      }
    };

    // Run first validation immediately
    validateAndFix();
  }

  async detectIssues() {
    const issues = [];

    try {
      // Run Simple Guardian validation (avoiding path issues)
      const simpleGuardianPath = path.join(this.rootPath, '.kiro', 'scripts', 'guardian-simple.js');
      if (fs.existsSync(simpleGuardianPath)) {
        try {
          const output = execSync(`node "${simpleGuardianPath}"`, {
            cwd: this.rootPath, // Run from project root
            encoding: 'utf8',
            timeout: 30000
          });

          // Parse Guardian output for issues
          if (output.includes('CONFLICT DETECTED') || output.includes('❌')) {
            const conflictLines = output.split('\n').filter(line =>
              line.includes('CONFLICT DETECTED') ||
              line.includes('❌') ||
              line.includes('⚠️')
            );

            for (const line of conflictLines) {
              issues.push({
                type: 'guardian_conflict',
                description: line.trim(),
                severity: 'high',
                source: 'guardian'
              });
            }
          }
        } catch (error) {
          // Guardian failed - this might indicate issues
          if (error.status !== 0) {
            issues.push({
              type: 'guardian_failure',
              description: `Guardian validation failed: ${error.message}`,
              severity: 'medium',
              source: 'guardian'
            });
          }
        }
      } else {
        // Fallback: Basic validation if Guardian scripts aren't available
        console.log('⚠️  Guardian scripts not found, performing basic validation...');
        await this.performBasicValidation(issues);
      }

      // Check for TypeScript errors
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
            description: `TypeScript errors: ${error.stdout.split('\n').filter(l => l.includes('error')).slice(0, 3).join('; ')}`,
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
          description: `Test failures: ${error.message}`,
          severity: 'medium',
          source: 'tests'
        });
      }

    } catch (error) {
      console.error('❌ Error detecting issues:', error.message);
    }

    return issues;
  }

  async performBasicValidation(issues) {
    // Basic validation that doesn't depend on Guardian scripts
    const specsDir = path.join(this.rootPath, '.kiro', 'specs');

    if (!fs.existsSync(specsDir)) {
      issues.push({
        type: 'missing_specs_directory',
        description: 'Specs directory not found',
        severity: 'medium',
        source: 'basic_validation'
      });
      return;
    }

    // Check for duplicate specs
    try {
      const specFolders = fs.readdirSync(specsDir)
        .filter(folder => !folder.startsWith('_') && !folder.startsWith('TEMPLATE'))
        .filter(folder => {
          const folderPath = path.join(specsDir, folder);
          return fs.statSync(folderPath).isDirectory();
        });

      // Look for specs with requirements but no implementation
      for (const specName of specFolders) {
        const specPath = path.join(specsDir, specName);
        const requirementsPath = path.join(specPath, 'requirements.md');

        if (fs.existsSync(requirementsPath)) {
          const isImplemented = await this.checkSpecImplemented(specName);
          if (!isImplemented) {
            // This isn't really an issue, just a pending implementation
            // We'll handle it in getPendingSpecs()
          }
        }
      }
    } catch (error) {
      issues.push({
        type: 'validation_error',
        description: `Error during basic validation: ${error.message}`,
        severity: 'low',
        source: 'basic_validation'
      });
    }
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
          // Check if already implemented
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
        path.basename(file).toLowerCase().includes(specNameLower) ||
        this.fileContentContains(file, specNameLower)
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

  fileContentContains(filePath, searchTerm) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return content.toLowerCase().includes(searchTerm.toLowerCase());
    } catch {
      return false;
    }
  }

  determineSpecPriority(specName) {
    const highPriorityKeywords = ['critical', 'urgent', 'security', 'fix', 'bug'];
    const mediumPriorityKeywords = ['feature', 'enhancement', 'improvement'];

    const specNameLower = specName.toLowerCase();

    if (highPriorityKeywords.some(keyword => specNameLower.includes(keyword))) {
      return 'high';
    } else if (mediumPriorityKeywords.some(keyword => specNameLower.includes(keyword))) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  async handleIssues(issues) {
    // Group issues by type and handle them
    const issuesByType = issues.reduce((groups, issue) => {
      if (!groups[issue.type]) groups[issue.type] = [];
      groups[issue.type].push(issue);
      return groups;
    }, {});

    for (const [issueType, issueList] of Object.entries(issuesByType)) {
      if (this.activeAgents.size >= this.maxConcurrent) {
        console.log(`⏳ Maximum concurrent agents reached, queuing ${issueType} issues...`);
        continue;
      }

      await this.launchCoderAgent({
        type: 'fix_issue',
        issueType,
        issues: issueList,
        priority: this.determineIssuePriority(issueList)
      });
    }
  }

  async handlePendingSpecs(pendingSpecs) {
    for (const spec of pendingSpecs) {
      if (this.activeAgents.size >= this.maxConcurrent) {
        console.log(`⏳ Maximum concurrent agents reached, skipping spec: ${spec.name}`);
        continue;
      }

      await this.launchCoderAgent({
        type: 'implement_spec',
        specName: spec.name,
        specPath: spec.path,
        priority: spec.priority
      });
    }
  }

  determineIssuePriority(issues) {
    const hasHighSeverity = issues.some(issue => issue.severity === 'high');
    return hasHighSeverity ? 'high' : 'medium';
  }

  async launchCoderAgent(task) {
    const agentId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log(`🤖 Launching coder agent ${agentId} for task: ${task.type}`);

    // Create the agent prompt based on task type
    const agentPrompt = await this.buildAgentPrompt(task);

    // Find Claude Code executable
    const claudeCodePath = await this.findClaudeCodePath();
    if (!claudeCodePath) {
      console.error(`❌ Claude Code not found for agent ${agentId}`);
      return;
    }

    // Prepare attachments
    const attachments = await this.prepareAgentAttachments(task);

    // Create temporary files for the agent
    const tempDir = path.join(this.rootPath, '.kiro', 'temp', agentId);
    fs.mkdirSync(tempDir, { recursive: true });

    const promptFile = path.join(tempDir, 'prompt.md');
    fs.writeFileSync(promptFile, agentPrompt);

    // Launch Claude Code as an autonomous agent
    const agentProcess = spawn('node', [
      claudeCodePath,
      '--output-format', 'stream-json',
      '--verbose',
      '--input-format', 'stream-json',
      '--model', 'glm-4.6',
      '--debug-to-stderr',
      '--permission-prompt-tool', 'stdio',
      '--permission-mode', 'default' // Use default permission mode
    ], {
      cwd: this.rootPath,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Track the agent
    this.activeAgents.set(agentId, {
      process: agentProcess,
      task,
      startTime: Date.now(),
      tempDir,
      status: 'running'
    });

    // Set up timeout
    const timeout = setTimeout(() => {
      console.log(`⏰ Agent ${agentId} timed out, terminating...`);
      this.terminateAgent(agentId);
    }, this.agentTimeout);

    // Send the autonomous agent prompt with better error handling
    const fullPrompt = this.buildFullAgentPrompt(agentPrompt, attachments);

    // Handle stdin errors
    agentProcess.stdin.on('error', (error) => {
      console.warn(`⚠️ Agent ${agentId} stdin error:`, error.message);
    });

    // Write the prompt with error handling
    try {
      agentProcess.stdin.write(fullPrompt);
      agentProcess.stdin.end();
    } catch (error) {
      console.error(`❌ Failed to send prompt to agent ${agentId}:`, error.message);
      clearTimeout(timeout);
      this.terminateAgent(agentId);
      return;
    }

    // Handle agent output
    agentProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`[${agentId}]: ${output}`);

        // Check if agent indicates completion
        if (output.includes('TASK COMPLETED') || output.includes('IMPLEMENTATION COMPLETE')) {
          clearTimeout(timeout);
          this.handleAgentCompletion(agentId);
        }
      }
    });

    agentProcess.stderr.on('data', (data) => {
      const errorOutput = data.toString().trim();
      if (errorOutput && !errorOutput.includes('[DEBUG]')) {
        console.error(`[${agentId} ERROR]: ${errorOutput}`);
      }
    });

    agentProcess.on('close', (code) => {
      clearTimeout(timeout);
      console.log(`🏁 Agent ${agentId} finished with code: ${code}`);
      this.handleAgentCompletion(agentId);
    });

    agentProcess.on('error', (error) => {
      clearTimeout(timeout);
      console.error(`❌ Agent ${agentId} error:`, error.message);
      this.terminateAgent(agentId);
    });

    // Handle process disconnect
    agentProcess.on('disconnect', () => {
      console.log(`🔌 Agent ${agentId} disconnected`);
      clearTimeout(timeout);
      this.handleAgentCompletion(agentId);
    });
  }

  async buildAgentPrompt(task) {
    if (task.type === 'fix_issue') {
      return `You are an autonomous debugging and fixing agent.

ISSUES TO FIX:
${task.issues.map(issue => `- ${issue.description} (${issue.severity} severity)`).join('\n')}

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
- Use available tools (Read, Write, Edit, Bash) as needed
- Test your changes with npm test
- Report completion when done

IMPORTANT: Work completely autonomously. Do not ask for clarification or permission.
Execute all necessary actions to fix the issues.

Start your response with "AUTONOMOUS FIX STARTED" and end with "TASK COMPLETED"`;
    }

    if (task.type === 'implement_spec') {
      return `You are an autonomous feature implementation agent.

SPEC TO IMPLEMENT: ${task.specName}

YOUR TASKS:
1. Read the complete specification in .kiro/specs/${task.specName}/
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
- Use available tools (Read, Write, Edit, Bash, Glob) as needed
- Test thoroughly with npm test
- Report completion when done

IMPORTANT: Work completely autonomously. Do not ask for clarification or permission.
Implement the entire feature according to the specification.

Start your response with "AUTONOMOUS IMPLEMENTATION STARTED" and end with "IMPLEMENTATION COMPLETE"`;
    }

    return 'You are an autonomous agent. Complete the assigned task independently.';
  }

  async prepareAgentAttachments(task) {
    const attachments = [];

    if (task.type === 'implement_spec') {
      const specDir = path.join(this.rootPath, '.kiro', 'specs', task.specName);
      const specFiles = ['requirements.md', 'design.md', 'tasks.md']
        .map(file => path.join(specDir, file))
        .filter(file => fs.existsSync(file));

      attachments.push(...specFiles);
    }

    // Always include architecture docs if they exist
    const archDir = path.join(this.rootPath, '.kiro', 'architecture');
    if (fs.existsSync(archDir)) {
      attachments.push(archDir);
    }

    return attachments;
  }

  buildFullAgentPrompt(basePrompt, attachments) {
    let fullPrompt = basePrompt;

    if (attachments.length > 0) {
      fullPrompt += '\n\nCONTEXT FILES:\n';

      for (const attachment of attachments) {
        const relativePath = path.relative(this.rootPath, attachment);

        if (fs.statSync(attachment).isDirectory()) {
          fullPrompt += `\nDIRECTORY: ${relativePath}\n`;
          const files = this.getAllTextFiles(attachment, 5);
          for (const file of files.slice(0, 10)) {
            const content = fs.readFileSync(file, 'utf8');
            const relativeFilePath = path.relative(this.rootPath, file);
            fullPrompt += `FILE: ${relativeFilePath}\n${this.truncateContent(content, 3000)}\n\n`;
          }
        } else {
          const content = fs.readFileSync(attachment, 'utf8');
          fullPrompt += `FILE: ${relativePath}\n${this.truncateContent(content, 5000)}\n\n`;
        }
      }
    }

    fullPrompt += '\n\nExecute the task autonomously. Start working now.';

    return fullPrompt;
  }

  getAllTextFiles(dirPath, maxDepth = 3, currentDepth = 0) {
    if (currentDepth >= maxDepth) return [];

    const files = [];
    try {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          files.push(...this.getAllTextFiles(fullPath, maxDepth, currentDepth + 1));
        } else if (stat.isFile() && this.isTextFile(fullPath)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignore errors
    }

    return files;
  }

  isTextFile(filePath) {
    const textExtensions = ['.md', '.txt', '.js', '.ts', '.tsx', '.jsx', '.json', '.yml', '.yaml', '.sql', '.prisma'];
    return textExtensions.some(ext => filePath.toLowerCase().endsWith(ext));
  }

  truncateContent(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength) + `\n...[truncated ${text.length - maxLength} chars]`;
  }

  async findClaudeCodePath() {
    const traePaths = [
      path.join('C:', 'Users', 'Mothetho', '.trae', 'extensions', 'anthropic.claude-code-2.0.1-universal', 'resources', 'claude-code', 'cli.js')
    ];

    for (const traPath of traePaths) {
      if (fs.existsSync(traPath)) {
        return traPath;
      }
    }

    if (process.env.CLAUDE_CODE_PATH) {
      return process.env.CLAUDE_CODE_PATH;
    }

    return null;
  }

  handleAgentCompletion(agentId) {
    const agent = this.activeAgents.get(agentId);
    if (!agent) return;

    console.log(`✅ Agent ${agentId} completed task: ${agent.task.type}`);

    // Clean up temporary files
    try {
      fs.rmSync(agent.tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`⚠️ Failed to cleanup temp dir for ${agentId}:`, error.message);
    }

    this.activeAgents.delete(agentId);
  }

  terminateAgent(agentId) {
    const agent = this.activeAgents.get(agentId);
    if (!agent) return;

    console.log(`🛑 Terminating agent ${agentId}...`);

    try {
      agent.process.kill('SIGTERM');
      setTimeout(() => {
        if (!agent.process.killed) {
          agent.process.kill('SIGKILL');
        }
      }, 5000);
    } catch (error) {
      console.error(`❌ Error terminating agent ${agentId}:`, error.message);
    }

    this.handleAgentCompletion(agentId);
  }

  shutdown() {
    console.log('\n🛑 Shutting down autonomous orchestrator...');
    this.isRunning = false;

    // Terminate all active agents
    for (const agentId of this.activeAgents.keys()) {
      this.terminateAgent(agentId);
    }

    // Wait for graceful shutdown
    setTimeout(() => {
      console.log('✅ Autonomous orchestrator shutdown complete');
      process.exit(0);
    }, 5000);
  }
}

// Start the autonomous orchestrator if this file is run directly
if (require.main === module) {
  const orchestrator = new AutonomousOrchestrator();
  orchestrator.start().catch(error => {
    console.error('❌ Failed to start autonomous orchestrator:', error.message);
    process.exit(1);
  });
}

module.exports = AutonomousOrchestrator;