#!/usr/bin/env node

/**
 * TRAE Claude Code Orchestrator
 * Bridges the gap between the job queue and TRAE Claude Code extensions
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { EventEmitter } = require('events');

class TraeOrchestrator extends EventEmitter {
  constructor() {
    super();
    this.rootPath = process.cwd();
    this.queueDir = path.join(this.rootPath, '.kiro', 'agents', 'claude-orchestrator', 'queue');
    this.isRunning = false;
    this.activeJobs = new Map();
    this.maxConcurrent = 3;
  }

  async start() {
    console.log('🚀 Starting TRAE Claude Code Orchestrator...');
    console.log(`📁 Queue directory: ${this.queueDir}`);

    // Ensure queue directory exists
    try {
      if (!fs.existsSync(this.queueDir)) {
        fs.mkdirSync(this.queueDir, { recursive: true });
        console.log('✅ Created queue directory');
      }
    } catch (error) {
      console.error('❌ Failed to create queue directory:', error.message);
      return;
    }

    this.isRunning = true;
    console.log('✅ Orchestrator started - monitoring for jobs...');

    // Start monitoring queue
    this.monitorQueue();

    // Handle graceful shutdown
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  monitorQueue() {
    const checkQueue = () => {
      if (!this.isRunning) return;

      try {
        const files = fs.readdirSync(this.queueDir)
          .filter(file => file.endsWith('.json'));

        // Process new jobs if we have capacity
        const availableSlots = this.maxConcurrent - this.activeJobs.size;
        if (availableSlots > 0 && files.length > 0) {
          const jobsToProcess = files.slice(0, availableSlots);
          jobsToProcess.forEach(file => this.processJob(file));
        }
      } catch (error) {
        console.error('❌ Error checking queue:', error.message);
      }

      // Schedule next check
      setTimeout(checkQueue, 1000);
    };

    checkQueue();
  }

  async processJob(filename) {
    const filePath = path.join(this.queueDir, filename);

    try {
      // Mark job as in-progress
      const processingPath = filePath + '.processing';
      fs.renameSync(filePath, processingPath);

      // Read job data
      const jobData = JSON.parse(fs.readFileSync(processingPath, 'utf8'));
      console.log(`📋 Processing job: ${jobData.specName || filename}`);

      // Track active job
      this.activeJobs.set(filename, {
        path: processingPath,
        data: jobData,
        startTime: Date.now()
      });

      // Execute job with Claude Code
      await this.executeClaudeJob(jobData);

      // Clean up
      this.activeJobs.delete(filename);
      try {
        fs.unlinkSync(processingPath);
      } catch {}

      console.log(`✅ Completed job: ${jobData.specName || filename}`);

    } catch (error) {
      console.error(`❌ Failed to process job ${filename}:`, error.message);

      // Move failed job back to queue for retry
      this.activeJobs.delete(filename);
      try {
        const failedPath = filePath + '.failed';
        fs.renameSync(processingPath, failedPath);
      } catch {}
    }
  }

  async executeClaudeJob(jobData) {
    const { specName, inlinePrompt, attachments } = jobData;

    if (!inlinePrompt) {
      throw new Error('No prompt provided in job data');
    }

    // Build the complete prompt with attachments
    let fullPrompt = inlinePrompt;

    if (attachments && attachments.length > 0) {
      const attachmentContent = await this.buildAttachmentContent(attachments);
      fullPrompt += '\n\n' + attachmentContent;
    }

    // Create a temporary prompt file
    const tempPromptFile = path.join(this.rootPath, `.kiro-temp-${specName || Date.now()}.md`);
    fs.writeFileSync(tempPromptFile, fullPrompt);

    try {
      // Find Claude Code executable in TRAE
      const claudeCodePath = await this.findClaudeCodePath();

      if (!claudeCodePath) {
        throw new Error('Claude Code not found in TRAE extensions');
      }

      console.log(`🤖 Starting Claude Code for: ${specName || 'unnamed job'}`);

      // Build the command to execute Claude Code with the prompt
      const args = [
        '--output-format', 'stream-json',
        '--verbose',
        '--input-format', 'stream-json',
        '--model', 'glm-4.6',
        '--debug-to-stderr',
        '--permission-prompt-tool', 'stdio',
        '--permission-mode', 'default'
      ];

      // If we have attachment files, add them
      if (attachments && attachments.length > 0) {
        const existingAttachments = attachments.filter(att =>
          fs.existsSync(path.isAbsolute(att) ? att : path.join(this.rootPath, att))
        );
        if (existingAttachments.length > 0) {
          args.push('--files', existingAttachments.join(','));
        }
      }

      // Execute Claude Code as a separate process that stays running
      const claudeProcess = spawn('node', [claudeCodePath, ...args], {
        cwd: this.rootPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Send the prompt to Claude Code
      claudeProcess.stdin.write(fullPrompt);
      claudeProcess.stdin.end();

      // Handle output
      claudeProcess.stdout.on('data', (data) => {
        console.log(`[Claude Code ${specName}]: ${data.toString().trim()}`);
      });

      claudeProcess.stderr.on('data', (data) => {
        console.error(`[Claude Code ${specName} Error]: ${data.toString().trim()}`);
      });

      claudeProcess.on('close', (code) => {
        console.log(`🎯 Claude Code process for ${specName} exited with code: ${code}`);
      });

      // Give the process time to start and handle the prompt
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log(`✅ Claude Code session started for: ${specName}`);

    } finally {
      // Clean up temporary prompt file
      try {
        fs.unlinkSync(tempPromptFile);
      } catch {}
    }
  }

  async buildAttachmentContent(attachments) {
    let content = '';

    for (const attachment of attachments) {
      const fullPath = path.isAbsolute(attachment)
        ? attachment
        : path.join(this.rootPath, attachment);

      if (!fs.existsSync(fullPath)) {
        console.warn(`⚠️ Attachment not found: ${attachment}`);
        continue;
      }

      try {
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          content += `\n\n<<<DIRECTORY:${attachment}>>>\n`;
          const files = this.getAllFiles(fullPath);
          for (const file of files.slice(0, 10)) { // Limit to prevent too much content
            const relativePath = path.relative(this.rootPath, file);
            const fileContent = fs.readFileSync(file, 'utf8');
            content += `FILE: ${relativePath}\n${this.truncateContent(fileContent, 5000)}\n\n`;
          }
          content += '<<<END>>>';
        } else {
          const fileContent = fs.readFileSync(fullPath, 'utf8');
          content += `\n\n<<<FILE:${attachment}>>>\n${this.truncateContent(fileContent, 10000)}\n<<<END>>>\n`;
        }
      } catch (error) {
        console.warn(`⚠️ Error reading attachment ${attachment}:`, error.message);
      }
    }

    return content;
  }

  getAllFiles(dirPath, maxDepth = 3, currentDepth = 0) {
    if (currentDepth >= maxDepth) return [];

    const files = [];
    try {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          files.push(...this.getAllFiles(fullPath, maxDepth, currentDepth + 1));
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
    // Try to find Claude Code in TRAE extension directory
    const traePaths = [
      path.join('C:', 'Users', 'Mothetho', '.trae', 'extensions', 'anthropic.claude-code-2.0.1-universal', 'resources', 'claude-code', 'cli.js'),
      path.join(process.env.HOME || '', '.trae', 'extensions', 'anthropic.claude-code-*', 'resources', 'claude-code', 'cli.js'),
      path.join(process.env.USERPROFILE || '', '.trae', 'extensions', 'anthropic.claude-code-*', 'resources', 'claude-code', 'cli.js')
    ];

    for (const traPath of traePaths) {
      try {
        // Handle glob patterns
        const globPath = traPath.replace('*', '2.0.1-universal');
        if (fs.existsSync(globPath)) {
          return globPath;
        }
      } catch {}
    }

    // Try environment variable
    if (process.env.CLAUDE_CODE_PATH) {
      return process.env.CLAUDE_CODE_PATH;
    }

    return null;
  }

  shutdown() {
    console.log('\n🛑 Shutting down orchestrator...');
    this.isRunning = false;

    // Wait for active jobs to finish (with timeout)
    const shutdownTimeout = setTimeout(() => {
      console.log('⏰ Shutdown timeout - forcing exit');
      process.exit(0);
    }, 10000);

    const checkJobs = () => {
      if (this.activeJobs.size === 0) {
        clearTimeout(shutdownTimeout);
        console.log('✅ All jobs completed - shutting down gracefully');
        process.exit(0);
      } else {
        console.log(`⏳ Waiting for ${this.activeJobs.size} jobs to complete...`);
        setTimeout(checkJobs, 1000);
      }
    };

    checkJobs();
  }
}

// Start the orchestrator if this file is run directly
if (require.main === module) {
  const orchestrator = new TraeOrchestrator();
  orchestrator.start().catch(error => {
    console.error('❌ Failed to start orchestrator:', error.message);
    process.exit(1);
  });
}

module.exports = TraeOrchestrator;