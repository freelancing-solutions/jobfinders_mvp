# VSCode-based Autonomous Coder System

This document describes the VSCode-based autonomous system that uses VSCode's internal command system instead of spawning Claude Code processes directly.

## 🎯 Why This Approach

The previous approach failed because:
- ❌ **Authentication Issues**: Claude Code API returned 401 errors
- ❌ **JSON Parsing Errors**: Claude Code expected JSON but received text prompts
- ❌ **Process Isolation**: Spawned processes couldn't access VSCode's Claude Code properly

## ✅ VSCode-based Solution

The new system:
- ✅ **Uses VSCode Internal Commands** - Leverages VSCode's built-in command system
- ✅ **No Authentication Issues** - Uses existing VSCode Claude Code session
- ✅ **Job Queue System** - Creates job files that VSCode extension can process
- ✅ **Interactive Control** - User can review and approve jobs before execution
- ✅ **Better Integration** - Works within VSCode environment

## 📁 System Components

### Core Files
- **`vscode-orchestrator.js`** - Main orchestrator that creates job files
- **`vscode-extension/`** - VSCode extension that processes the jobs
- **`start-vscode-system.js`** - Launcher script

### How It Works
1. **Orchestrator** detects issues and creates job files in `.kiro/vscode-jobs/`
2. **VSCode Extension** monitors this directory and processes new jobs
3. **User Interaction** - Extension prompts user to start Claude Code for each job
4. **Autonomous Execution** - Claude Code works through the task independently

## 🛠️ Setup Instructions

### 1. Install the VSCode Extension

```bash
# Method 1: Install from VSIX (if you package it)
code --install-extension .kiro/vscode-extension/

# Method 2: Install from source
# 1. Open VSCode
# 2. Go to Extensions (Ctrl+Shift+X)
# 3. Click "Install from VSIX..."
# 4. Navigate to .kiro/vscode-extension/package.json
```

### 2. Start the System

```bash
# Start the VSCode orchestrator
node .kiro/scripts/start-vscode-system.js
```

### 3. Use VSCode Commands

Once the extension is installed, use these commands:

- **`Autonomous Coder: Start Orchestrator`** - Starts the monitoring system
- **`Autonomous Coder: Process Job`** - Manually processes pending jobs
- **`Autonomous Coder: Show Active Jobs`** - Shows currently running jobs

## 📊 Workflow

### Automatic Detection
1. **Orchestrator runs validation** every 30 seconds
2. **Issues detected** → Job files created
3. **VSCode Extension** detects new job files
4. **User notified** to start Claude Code

### Manual Processing
1. **Job file appears** in `.kiro/vscode-jobs/`
2. **User runs** "Autonomous Coder: Process Job" command
3. **Extension opens** a new document with the task prompt
4. **User chooses** to start Claude Code or mark as completed/failed

### Job File Format
```json
{
  "agentId": "agent-1759884248984-kotcj051j",
  "task": {
    "type": "fix_issue",
    "issueType": "test_failure",
    "issues": [...],
    "priority": "high"
  },
  "prompt": "You are an autonomous debugging and fixing agent...",
  "timestamp": 1759884248984,
  "status": "pending",
  "startedAt": null,
  "completedAt": null,
  "summary": null
}
```

## 🎮 Usage Examples

### Start Full Autonomous System
```bash
# Terminal 1: Start orchestrator
node .kiro/scripts/start-vscode-system.js

# Terminal 2: Watch for job files
ls -la .kiro/vscode-jobs/
```

### Process Jobs Manually in VSCode
1. **Open Command Palette** (Ctrl+Shift+P)
2. **Run** "Autonomous Coder: Process Job"
3. **Choose action** when prompted:
   - "Start Claude Code" - Opens Claude Code with the task
   - "Mark Completed" - Marks job as done
   - "Mark Failed" - Marks job as failed

### Monitor Active Jobs
1. **Open Command Palette** (Ctrl+Shift+P)
2. **Run** "Autonomous Coder: Show Active Jobs"
3. **See list** of currently processing agents

## 🔧 Configuration

### Orchestrator Settings
```javascript
const orchestrator = new VSCodeOrchestrator({
  validationInterval: 30000,    // Check every 30 seconds
  maxConcurrent: 3,             // Max 3 simultaneous jobs
  agentTimeout: 300000,         // 5 minutes per job
});
```

### Extension Features
- **Output Channel** - "Autonomous Coder" panel shows activity
- **Job Monitoring** - Tracks active jobs and their status
- **File Watching** - Automatically detects new job files
- **Error Handling** - Graceful handling of failures

## 🎯 Benefits

1. **No Authentication Issues** - Uses existing VSCode session
2. **Better Error Handling** - VSCode extension handles errors gracefully
3. **User Control** - User can review jobs before execution
4. **Integration** - Works seamlessly with VSCode interface
5. **Flexibility** - Can be used automatically or manually

## 🚨 Troubleshooting

### Extension Not Working
1. **Check** if extension is properly installed
2. **Reload** VSCode window (Ctrl+Shift+P → "Developer: Reload Window")
3. **Check** Output Channel for "Autonomous Coder" messages

### Jobs Not Processing
1. **Verify** orchestrator is running
2. **Check** `.kiro/vscode-jobs/` directory for job files
3. **Run** "Autonomous Coder: Process Job" command manually

### Claude Code Not Starting
1. **Ensure** Claude Code extension is installed and active
2. **Check** if you're logged into Claude Code
3. **Try** opening Claude Code manually first

## 🎉 Success Indicators

You'll know the system is working when:
- ✅ Orchestrator creates job files when issues are detected
- ✅ VSCode extension detects and processes job files
- ✅ Claude Code opens with proper autonomous agent prompts
- ✅ Jobs are marked as completed/failed appropriately
- ✅ Active jobs are tracked in the output channel

## 🔄 Future Enhancements

- **Automatic Claude Code launching** - Remove manual step
- **Job priority system** - Process high-priority jobs first
- **Job retry logic** - Automatically retry failed jobs
- **Progress tracking** - Show detailed progress for long-running jobs
- **Integration with Guardian** - Run validation before job completion

The VSCode-based system provides a robust, user-controlled approach to autonomous coding while avoiding the technical issues with direct Claude Code process spawning!