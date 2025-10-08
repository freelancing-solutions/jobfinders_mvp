# TRAE Claude Code Orchestrator

This document explains how to use the updated orchestrator system that works with TRAE Claude Code extensions.

## 🎯 Problem Solved

The original orchestrator was designed as a VSCode extension that expected to communicate with Claude Code running in the same VSCode instance. However, in the TRAE environment, Claude Code runs as a separate extension process.

## 🚀 New Solution

The new system consists of:

1. **`trae-orchestrator.js`** - A standalone Node.js process that monitors job queues and launches Claude Code sessions
2. **Updated `launch-system.js`** - Now starts the TRAE orchestrator as a background process
3. **`test-trae-orchestrator.js`** - Test script to verify the system works

## 📋 How It Works

1. **Queue Creation**: Jobs are created in `.kiro/agents/claude-orchestrator/queue/`
2. **Orchestrator Monitoring**: The TRAE orchestrator monitors this directory
3. **Claude Code Launch**: When a job is found, it launches Claude Code with the proper prompt and attachments
4. **Session Management**: Multiple Claude Code sessions can run concurrently (max 3 by default)
5. **Job Cleanup**: Completed jobs are removed from the queue

## 🛠️ Usage

### Quick Test

```bash
# Test the orchestrator with a simple job
node .kiro/scripts/test-trae-orchestrator.js
```

### Run Full Orchestration

```bash
# Run orchestration for all specs
node .kiro/scripts/launch-system.js

# Run orchestration for a specific spec
node .kiro/scripts/launch-system.js saved-jobs
```

### Manual Job Creation

You can also create jobs manually:

```javascript
// Example job file content
{
  "specName": "my-feature",
  "inlinePrompt": "You are an implementation agent. Implement the feature described in the spec.",
  "attachments": [".kiro/specs/my-feature/requirements.md", ".kiro/specs/my-feature/design.md"]
}
```

Save this as `.kiro/agents/claude-orchestrator/queue/timestamp_my-feature.json` and the orchestrator will pick it up.

## 🔧 Configuration

### Claude Code Path

The orchestrator automatically tries to find Claude Code in these locations:

1. `C:\Users\Mothetho\.trae\extensions\anthropic.claude-code-2.0.1-universal\resources\claude-code\cli.js`
2. Environment variable `CLAUDE_CODE_PATH`
3. Other standard TRAE extension paths

If Claude Code is in a different location, set the environment variable:

```bash
export CLAUDE_CODE_PATH="/path/to/your/claude-code/cli.js"
```

### Concurrency

By default, the orchestrator runs up to 3 Claude Code sessions concurrently. This can be modified in the `TraeOrchestrator` constructor:

```javascript
this.maxConcurrent = 3; // Change this value
```

## 📊 Expected Output

When the orchestrator is running, you'll see output like:

```
🚀 Starting TRAE Claude Code Orchestrator...
📁 Queue directory: /path/to/project/.kiro/agents/claude-orchestrator/queue
✅ Created queue directory
✅ Orchestrator started - monitoring for jobs...
📋 Processing job: my-feature
🤖 Starting Claude Code for: my-feature
✅ Claude Code session started for: my-feature
✅ Completed job: my-feature
```

## 🐛 Troubleshooting

### Claude Code Not Found

If you see "Claude Code not found in TRAE extensions", check:

1. Make sure TRAE is installed and Claude Code extension is active
2. Verify the path in the `findClaudeCodePath()` function
3. Set the `CLAUDE_CODE_PATH` environment variable

### Jobs Not Processing

1. Check that the queue directory exists and is writable
2. Verify the orchestrator process is running
3. Check file permissions

### Claude Code Sessions Fail to Start

1. Ensure Claude Code is properly installed in TRAE
2. Check that the model `glm-4.6` is available
3. Verify TRAE has sufficient resources to run multiple sessions

## 🔄 Integration with Existing Workflow

The new system is backward compatible with your existing `.kiro/specs/` structure. Just run:

```bash
node .kiro/scripts/launch-system.js
```

This will:
1. Run Guardian validation
2. Queue jobs for all specs
3. Start the TRAE orchestrator
4. Launch Claude Code sessions for each spec

## 📝 Monitoring

The orchestrator provides real-time feedback about:
- Jobs being processed
- Claude Code session launches
- Completion status
- Any errors that occur

Each Claude Code session runs independently, so you can have multiple implementation sessions running simultaneously.

## 🛡️ Safety Features

- **Job Isolation**: Each job runs in a separate Claude Code process
- **Error Handling**: Failed jobs are moved to `.failed` files for inspection
- **Graceful Shutdown**: Ctrl+C properly stops all running sessions
- **Resource Limits**: Maximum concurrent sessions prevent system overload

## 🎉 Success!

With this setup, your orchestrator can now:
- ✅ Start up and stay running
- ✅ Communicate with TRAE Claude Code extensions
- ✅ Process multiple jobs concurrently
- ✅ Provide real-time feedback
- ✅ Handle errors gracefully

The orchestrator is now ready to serve as your agentic coder coordinator!