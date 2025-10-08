const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class AutonomousCoderExtension {
  constructor() {
    this.activeJobs = new Map();
    this.outputChannel = vscode.window.createOutputChannel('Autonomous Coder');
  }

  activate(context) {
    this.outputChannel.appendLine('🚀 Autonomous Coder Extension activated');

    // Register commands
    const processJobCommand = vscode.commands.registerCommand('autonomous-coder.processJob', () => {
      this.processJob();
    });

    const startOrchestratorCommand = vscode.commands.registerCommand('autonomous-coder.startOrchestrator', () => {
      this.startOrchestrator();
    });

    const showJobsCommand = vscode.commands.registerCommand('autonomous-coder.showJobs', () => {
      this.showActiveJobs();
    });

    // Start watching for job files
    this.startJobWatcher();

    context.subscriptions.push(processJobCommand, startOrchestratorCommand, showJobsCommand);
  }

  startJobWatcher() {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) return;

    const jobsDir = path.join(workspaceRoot, '.kiro', 'vscode-jobs');
    try {
      if (!fs.existsSync(jobsDir)) {
        fs.mkdirSync(jobsDir, { recursive: true });
      }
    } catch (error) {
      this.outputChannel.appendLine(`❌ Failed to create jobs directory: ${error.message}`);
      return;
    }

    // Watch for new job files
    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(jobsDir, '*.json')
    );

    watcher.onDidCreate((uri) => {
      this.outputChannel.appendLine(`📝 New job detected: ${path.basename(uri.fsPath)}`);
      this.processJobFile(uri.fsPath);
    });

    this.outputChannel.appendLine(`👀 Watching for jobs in: ${jobsDir}`);
  }

  async processJob() {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
      vscode.window.showErrorMessage('No workspace folder found');
      return;
    }

    const jobsDir = path.join(workspaceRoot, '.kiro', 'vscode-jobs');
    if (!fs.existsSync(jobsDir)) {
      vscode.window.showInformationMessage('No jobs directory found');
      return;
    }

    const jobFiles = fs.readdirSync(jobsDir).filter(file => file.endsWith('.json'));
    if (jobFiles.length === 0) {
      vscode.window.showInformationMessage('No pending jobs found');
      return;
    }

    // Pick the first pending job
    const jobFile = jobFiles[0];
    const jobPath = path.join(jobsDir, jobFile);

    await this.processJobFile(jobPath);
  }

  async processJobFile(jobPath) {
    try {
      const jobData = JSON.parse(fs.readFileSync(jobPath, 'utf8'));
      const agentId = jobData.agentId;

      if (this.activeJobs.has(agentId)) {
        this.outputChannel.appendLine(`⚠️ Job ${agentId} already active`);
        return;
      }

      this.outputChannel.appendLine(`🤖 Processing job: ${agentId}`);
      this.outputChannel.appendLine(`📋 Task type: ${jobData.task.type}`);

      // Track the job
      this.activeJobs.set(agentId, {
        jobData,
        startTime: Date.now(),
        jobPath
      });

      // Execute the job using Claude Code
      await this.executeClaudeJob(jobData, jobPath);

    } catch (error) {
      this.outputChannel.appendLine(`❌ Error processing job ${jobPath}: ${error.message}`);
      this.markJobFailed(jobPath, error.message);
    }
  }

  async executeClaudeJob(jobData, jobPath) {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const agentId = jobData.agentId;

    try {
      // Update job status to 'running'
      jobData.status = 'running';
      jobData.startedAt = new Date().toISOString();
      fs.writeFileSync(jobPath, JSON.stringify(jobData, null, 2));

      // Prepare the prompt with attachments
      const fullPrompt = await this.buildFullPrompt(jobData);

      // Use VSCode's internal command to execute Claude Code
      this.outputChannel.appendLine(`🎯 Starting Claude Code for agent: ${agentId}`);

      // Try to use VSCode's built-in chat/execute command
      const success = await this.executeWithVSCodeCommand(fullPrompt, jobData);

      if (success) {
        this.outputChannel.appendLine(`✅ Claude Code job completed for: ${agentId}`);
        this.markJobCompleted(jobPath, 'Job completed successfully via VSCode command');
      } else {
        this.outputChannel.appendLine(`⚠️ VSCode command failed, trying fallback method for: ${agentId}`);
        await this.executeFallback(jobData, jobPath);
      }

    } catch (error) {
      this.outputChannel.appendLine(`❌ Claude Code execution failed for ${agentId}: ${error.message}`);
      this.markJobFailed(jobPath, error.message);
    } finally {
      this.activeJobs.delete(agentId);
    }
  }

  async executeWithVSCodeCommand(prompt, jobData) {
    try {
      // Method 1: Try to use the 'workbench.action.chat.open' command
      await vscode.commands.executeCommand('workbench.action.chat.open');

      // Wait a moment for the chat to open
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Method 2: Try to use the 'github.copilot.chat.send' or similar command
      // This depends on what Claude Code extension provides

      // For now, we'll create a new document with the prompt
      const doc = await vscode.workspace.openTextDocument({
        content: `# Autonomous Agent Task\n\n${prompt}\n\n---\n\n*This is an autonomous agent task. The agent should work through this prompt independently.*`,
        language: 'markdown'
      });

      await vscode.window.showTextDocument(doc);

      // Show notification to user
      const result = await vscode.window.showInformationMessage(
        `Autonomous agent task ready: ${jobData.agentId}`,
        'Start Claude Code',
        'Mark Completed',
        'Mark Failed'
      );

      switch (result) {
        case 'Start Claude Code':
          // Try to open Claude Code with the current context
          try {
            await vscode.commands.executeCommand('claude.chat.open');
            return true;
          } catch (error) {
            this.outputChannel.appendLine(`⚠️ Claude Code command not available: ${error.message}`);
            return false;
          }

        case 'Mark Completed':
          this.markJobCompleted(jobData.jobPath, 'Manually marked as completed');
          return true;

        case 'Mark Failed':
          this.markJobFailed(jobData.jobPath, 'Manually marked as failed');
          return true;

        default:
          return false;
      }

    } catch (error) {
      this.outputChannel.appendLine(`❌ VSCode command execution failed: ${error.message}`);
      return false;
    }
  }

  async executeFallback(jobData, jobPath) {
    // Fallback: create a task for the user to manually run
    const task = new vscode.Task(
      { type: 'autonomous-coder', task: jobData.agentId },
      vscode.TaskScope.Workspace,
      `Autonomous Agent: ${jobData.task.type}`,
      'autonomous-coder',
      new vscode.ShellExecution('echo', [
        'Please run Claude Code manually to process this autonomous agent task'
      ]),
      []
    );

    vscode.tasks.executeTask(task);

    vscode.window.showWarningMessage(
      `Fallback method used for agent ${jobData.agentId}. Please check the Tasks panel.`
    );
  }

  async buildFullPrompt(jobData) {
    let prompt = jobData.prompt;

    // Add context attachments if needed
    if (jobData.task.type === 'implement_spec') {
      const specPath = path.join(this.getRootPath(), '.kiro', 'specs', jobData.task.specName);

      if (fs.existsSync(specPath)) {
        prompt += '\n\nSPECIFICATION FILES:\n';

        const specFiles = ['requirements.md', 'design.md', 'tasks.md']
          .map(file => path.join(specPath, file))
          .filter(file => fs.existsSync(file));

        for (const specFile of specFiles) {
          const content = fs.readFileSync(specFile, 'utf8');
          const relativePath = path.relative(this.getRootPath(), specFile);
          prompt += `\n\n--- ${relativePath} ---\n${content}\n`;
        }
      }
    }

    return prompt;
  }

  getRootPath() {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
  }

  markJobCompleted(jobPath, summary) {
    try {
      const jobData = JSON.parse(fs.readFileSync(jobPath, 'utf8'));
      jobData.status = 'completed';
      jobData.completedAt = new Date().toISOString();
      jobData.summary = summary;
      fs.writeFileSync(jobPath, JSON.stringify(jobData, null, 2));

      this.outputChannel.appendLine(`✅ Job marked as completed: ${jobData.agentId}`);
    } catch (error) {
      this.outputChannel.appendLine(`❌ Failed to mark job as completed: ${error.message}`);
    }
  }

  markJobFailed(jobPath, error) {
    try {
      const jobData = JSON.parse(fs.readFileSync(jobPath, 'utf8'));
      jobData.status = 'failed';
      jobData.failedAt = new Date().toISOString();
      jobData.error = error;
      fs.writeFileSync(jobPath, JSON.stringify(jobData, null, 2));

      this.outputChannel.appendLine(`❌ Job marked as failed: ${jobData.agentId} - ${error}`);
    } catch (error) {
      this.outputChannel.appendLine(`❌ Failed to mark job as failed: ${error.message}`);
    }
  }

  async startOrchestrator() {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
      vscode.window.showErrorMessage('No workspace folder found');
      return;
    }

    const orchestratorPath = path.join(workspaceRoot, '.kiro', 'scripts', 'vscode-orchestrator.js');
    if (!fs.existsSync(orchestratorPath)) {
      vscode.window.showErrorMessage('VSCode orchestrator script not found');
      return;
    }

    // Start the orchestrator in a terminal
    const terminal = vscode.window.createTerminal({
      name: 'Autonomous Orchestrator',
      cwd: workspaceRoot,
      shellPath: 'node',
      shellArgs: [orchestratorPath]
    });

    terminal.show();
    this.outputChannel.appendLine('🚀 Started autonomous orchestrator in terminal');
  }

  showActiveJobs() {
    if (this.activeJobs.size === 0) {
      vscode.window.showInformationMessage('No active jobs');
      return;
    }

    const jobList = Array.from(this.activeJobs.entries()).map(([id, job]) => {
      const duration = Math.floor((Date.now() - job.startTime) / 1000);
      return `${id} - ${job.jobData.task.type} (${duration}s)`;
    });

    vscode.window.showQuickPick(jobList, {
      placeHolder: 'Active Jobs'
    });
  }

  deactivate() {
    this.outputChannel.appendLine('🛑 Autonomous Coder Extension deactivated');
    this.outputChannel.dispose();
  }
}

// Create extension instance
const extension = new AutonomousCoderExtension();

function activate(context) {
  extension.activate(context);
}

function deactivate() {
  extension.deactivate();
}

module.exports = {
  activate,
  deactivate
};