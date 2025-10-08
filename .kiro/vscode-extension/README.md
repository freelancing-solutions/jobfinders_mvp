# Autonomous Coder Extension

A VSCode extension that processes autonomous coder jobs and integrates with Claude Code.

## Features

- Monitors for autonomous coder jobs in `.kiro/vscode-jobs/`
- Processes jobs using Claude Code
- Provides commands for job management
- Tracks active jobs and their status

## Commands

- `Autonomous Coder: Process Job` - Process pending autonomous coder jobs
- `Autonomous Coder: Start Orchestrator` - Start the autonomous orchestrator
- `Autonomous Coder: Show Active Jobs` - Show currently active jobs

## Setup

1. Install this extension in VSCode
2. Start the orchestrator using the command or by running the script directly
3. The extension will automatically detect and process jobs

## Requirements

- VSCode 1.80.0 or higher
- Claude Code extension
- Node.js for running the orchestrator