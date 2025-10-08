# VSCode Extension Integration

## Problem
The orchestrator outputs bash commands, but you want it to automatically launch Claude Code in VSCode extension mode so the agent can see its recommendations and start working.

## Solution: VSCode Tasks + Deep Links

### Option 1: VSCode Tasks (Recommended)

Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Orchestrator: Plan Implementation",
      "type": "shell",
      "command": "code",
      "args": [
        "--goto",
        ".kiro/prompts/orchestrator.md:1:1"
      ],
      "presentation": {
        "reveal": "always",
        "panel": "new",
        "focus": true
      },
      "problemMatcher": []
    },
    {
      "label": "Orchestrator: Execute Plan",
      "type": "shell",
      "command": "node",
      "args": ["${workspaceFolder}/.kiro/scripts/orchestrator-launcher.js"],
      "presentation": {
        "reveal": "always",
        "panel": "new",
        "focus": true
      },
      "problemMatcher": []
    },
    {
      "label": "Implementation Agent: Run",
      "type": "shell",
      "command": "node",
      "args": [
        "${workspaceFolder}/.kiro/scripts/implementation-launcher.js",
        "${input:specFile}"
      ],
      "presentation": {
        "reveal": "always",
        "panel": "new",
        "focus": true
      },
      "problemMatcher": []
    }
  ],
  "inputs": [
    {
      "id": "specFile",
      "type": "pickString",
      "description": "Select spec to implement",
      "options": [],
      "default": ""
    }
  ]
}
```

### Option 2: Node.js Launcher Scripts

Create `.kiro/scripts/orchestrator-launcher.js`:

```javascript
#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🎯 Starting Orchestrator in VSCode Extension Mode...\n');

// Read specs to get implementation list
const specsDir = path.join(process.cwd(), '.kiro/specs');
const specs = fs.readdirSync(specsDir)
  .filter(f => f.endsWith('.md') && !f.startsWith('_'));

console.log('📋 Available specs:', specs.length);
console.log('');

// Create orchestrator prompt with context
const orchestratorPrompt = `
You are the Implementation Orchestrator running in VSCode Extension Mode.

CONTEXT:
- You are running inside VSCode with access to the project
- Claude Code extension is active
- User can see your output in the VSCode chat panel

AVAILABLE SPECS:
${specs.map(s => `- .kiro/specs/${s}`).join('\n')}

YOUR TASK:
1. Analyze all specs in .kiro/specs/ (exclude _archive/)
2. Check .kiro/_CodeReviews/ to see what's already implemented
3. Create a prioritized implementation plan
4. For each unimplemented spec, prepare a task that will:
   - First run Guardian validation
   - Then spawn an implementation agent with the spec
   
OUTPUT FORMAT:
For each spec that needs implementation, output:

\`\`\`json
{
  "task": "implement",
  "spec": ".kiro/specs/[filename].md",
  "priority": "high|medium|low",
  "dependencies": ["other-spec.md"],
  "reason": "Why this needs implementation"
}
\`\`\`

After listing all tasks, ask:
"Should I proceed with implementations? Reply 'yes' to start, or select specific tasks."

IMPORTANT:
- You are in a VSCode chat session
- User will respond to your questions
- Wait for user confirmation before proceeding
- After user confirms, you will spawn implementation agents
`;

// Launch Claude Code in extension mode
const claudeCode = spawn('code', [
  '--command',
  'claude.chat.open'
], {
  stdio: 'inherit',
  shell: true
});

claudeCode.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ Failed to launch Claude Code extension');
    process.exit(1);
  }
});

// Give VSCode time to open
setTimeout(() => {
  console.log('✅ Claude Code extension should now be open');
  console.log('📋 Copy and paste this prompt into the chat:\n');
  console.log('─'.repeat(60));
  console.log(orchestratorPrompt);
  console.log('─'.repeat(60));
}, 2000);
```

### Option 3: Direct Claude Code Extension API

Create `.kiro/scripts/vscode-orchestrator.js`:

```javascript
#!/usr/bin/env node
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

async function startOrchestrator() {
  // Check if running in VSCode extension context
  if (!vscode.workspace.workspaceFolders) {
    console.error('❌ Must run from VSCode extension context');
    process.exit(1);
  }

  const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
  const specsDir = path.join(workspaceRoot, '.kiro/specs');
  
  // Read orchestrator prompt
  const orchestratorPromptPath = path.join(workspaceRoot, '.kiro/prompts/orchestrator.md');
  const orchestratorPrompt = fs.readFileSync(orchestratorPromptPath, 'utf8');
  
  // Get specs
  const specs = fs.readdirSync(specsDir)
    .filter(f => f.endsWith('.md') && !f.startsWith('_'))
    .map(f => path.join(specsDir, f));

  // Open Claude Code chat
  await vscode.commands.executeCommand('claude.chat.open');
  
  // Send orchestrator prompt with context
  await vscode.commands.executeCommand('claude.chat.sendMessage', {
    message: orchestratorPrompt,
    context: {
      files: [
        ...specs,
        path.join(workspaceRoot, '.kiro/architecture/*.json'),
        path.join(workspaceRoot, '.kiro/_CodeReviews/*.md')
      ]
    }
  });
  
  console.log('✅ Orchestrator started in Claude Code chat');
}

startOrchestrator().catch(console.error);
```

### Option 4: VSCode Extension Command (Best Integration)

Create a VSCode extension command in `.vscode/extensions/jobfinders-orchestrator/`:

**package.json:**
```json
{
  "name": "jobfinders-orchestrator",
  "displayName": "JobFinders Orchestrator",
  "version": "1.0.0",
  "engines": {
    "vscode": "^1.80.0"
  },
  "activationEvents": [
    "onCommand:jobfinders.startOrchestrator",
    "onCommand:jobfinders.implementSpec"
  ],
  "main": "./extension.js",
  "contributes": {
    "commands": [
      {
        "command": "jobfinders.startOrchestrator",
        "title": "JobFinders: Start Implementation Orchestrator"
      },
      {
        "command": "jobfinders.implementSpec",
        "title": "JobFinders: Implement Selected Spec"
      }
    ],
    "keybindings": [
      {
        "command": "jobfinders.startOrchestrator",
        "key": "ctrl+alt+o",
        "mac": "cmd+alt+o"
      }
    ]
  }
}
```

**extension.js:**
```javascript
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

function activate(context) {
  
  // Command: Start Orchestrator
  let orchestratorCommand = vscode.commands.registerCommand(
    'jobfinders.startOrchestrator',
    async () => {
      const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
      const specsDir = path.join(workspaceRoot, '.kiro/specs');
      
      // Get all specs
      const specs = fs.readdirSync(specsDir)
        .filter(f => f.endsWith('.md') && !f.startsWith('_'));
      
      // Check for existing implementations
      const reviewsDir = path.join(workspaceRoot, '.kiro/_CodeReviews');
      const reviews = fs.existsSync(reviewsDir) 
        ? fs.readdirSync(reviewsDir)
        : [];
      
      // Read orchestrator prompt
      const promptPath = path.join(workspaceRoot, '.kiro/prompts/orchestrator.md');
      const orchestratorPrompt = fs.readFileSync(promptPath, 'utf8');
      
      // Build context
      const context = {
        specs: specs.map(s => path.join(specsDir, s)),
        reviews: reviews.map(r => path.join(reviewsDir, r)),
        architecture: [
          path.join(workspaceRoot, '.kiro/architecture')
        ]
      };
      
      // Open Claude Code and send prompt
      await vscode.commands.executeCommand('workbench.action.chat.open', {
        query: orchestratorPrompt,
        isPartialQuery: false
      });
      
      // Add context files
      for (const file of [...context.specs, ...context.reviews]) {
        await vscode.commands.executeCommand('workbench.action.chat.attachContext', {
          uri: vscode.Uri.file(file)
        });
      }
      
      vscode.window.showInformationMessage('🎯 Orchestrator started in Claude chat');
    }
  );
  
  // Command: Implement specific spec
  let implementCommand = vscode.commands.registerCommand(
    'jobfinders.implementSpec',
    async () => {
      const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
      const specsDir = path.join(workspaceRoot, '.kiro/specs');
      
      // Get specs
      const specs = fs.readdirSync(specsDir)
        .filter(f => f.endsWith('.md') && !f.startsWith('_'));
      
      // Show quick pick
      const selected = await vscode.window.showQuickPick(specs, {
        placeHolder: 'Select spec to implement'
      });
      
      if (!selected) return;
      
      const specPath = path.join(specsDir, selected);
      const agentPromptPath = path.join(workspaceRoot, '.kiro/prompts/implementation-agent.md');
      
      // Read prompts
      const agentPrompt = fs.readFileSync(agentPromptPath, 'utf8');
      const specContent = fs.readFileSync(specPath, 'utf8');
      
      // Combine prompts
      const fullPrompt = `${agentPrompt}

ASSIGNED SPEC: ${selected}

SPEC CONTENT:
${specContent}

Begin implementation now. Remember your boundaries!`;
      
      // Open Claude chat with implementation agent
      await vscode.commands.executeCommand('workbench.action.chat.open', {
        query: fullPrompt,
        isPartialQuery: false
      });
      
      // Attach relevant files
      await vscode.commands.executeCommand('workbench.action.chat.attachContext', {
        uri: vscode.Uri.file(specPath)
      });
      
      vscode.window.showInformationMessage(`🚀 Implementing ${selected}...`);
    }
  );
  
  context.subscriptions.push(orchestratorCommand, implementCommand);
}

function deactivate() {}

module.exports = { activate, deactivate };
```

### Option 5: Simple Bash + VSCode CLI

Create `.kiro/scripts/vscode-launch.sh`:

```bash
#!/bin/bash

ACTION=$1
SPEC_FILE=$2

case $ACTION in
  orchestrator)
    echo "🎯 Launching Orchestrator in VSCode..."
    
    # Open VSCode and focus on orchestrator prompt
    code .kiro/prompts/orchestrator.md
    
    # Wait for VSCode to open
    sleep 2
    
    # Trigger Claude Code extension
    code --command workbench.action.chat.open
    
    echo ""
    echo "✅ VSCode is now open"
    echo "📋 In the Claude chat panel, type:"
    echo ""
    echo "@orchestrator Analyze specs and create implementation plan"
    echo ""
    ;;
    
  implement)
    if [ -z "$SPEC_FILE" ]; then
      echo "Usage: ./vscode-launch.sh implement <spec-file>"
      exit 1
    fi
    
    echo "🚀 Launching Implementation Agent for $SPEC_FILE..."
    
    # Open spec file
    code ".kiro/specs/$SPEC_FILE"
    
    # Open Claude chat
    code --command workbench.action.chat.open
    
    echo ""
    echo "✅ VSCode is now open"
    echo "📋 In the Claude chat panel, type:"
    echo ""
    echo "@implementation-agent Implement .kiro/specs/$SPEC_FILE"
    echo ""
    ;;
    
  *)
    echo "Usage:"
    echo "  ./vscode-launch.sh orchestrator"
    echo "  ./vscode-launch.sh implement <spec-file>"
    exit 1
    ;;
esac
```

## Recommended Setup

**For immediate use (no coding required):**

1. Use **Option 5 (Bash + VSCode CLI)**:
```bash
chmod +x .kiro/scripts/vscode-launch.sh
./kiro/scripts/vscode-launch.sh orchestrator
```

2. This opens VSCode with Claude Code extension active and tells you what to type

**For better integration:**

1. Use **Option 4 (VSCode Extension)**
2. Install your custom extension in VSCode
3. Press `Ctrl+Alt+O` (or `Cmd+Alt+O` on Mac) to launch orchestrator
4. Or use Command Palette: "JobFinders: Start Implementation Orchestrator"

## Auto-Start Workflow

Create `.kiro/scripts/auto-orchestrate.sh`:

```bash
#!/bin/bash
set -e

echo "🎯 JobFinders Auto-Orchestrator"
echo ""

# Step 1: Open VSCode
echo "Opening VSCode..."
code .

# Step 2: Wait for VSCode
sleep 3

# Step 3: Open Claude Code
echo "Opening Claude Code extension..."
code --command workbench.action.chat.open

# Step 4: Instructions
sleep 2
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ VSCode + Claude Code is now open"
echo ""
echo "In the Claude chat panel, paste this:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
cat .kiro/prompts/orchestrator.md
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Then add these files as context:"
echo "- .kiro/specs/ (all active specs)"
echo "- .kiro/architecture/ (all files)"
echo "- .kiro/_CodeReviews/ (all files)"
echo ""
echo "The orchestrator will analyze and create a plan."
```

Usage:
```bash
chmod +x .kiro/scripts/auto-orchestrate.sh
./kiro/scripts/auto-orchestrate.sh
```

## The Flow

1. Run launcher script
2. VSCode opens with Claude Code extension
3. Orchestrator prompt is loaded with context
4. Claude analyzes specs and asks: "Should I implement these?"
5. You respond "yes" or select specific ones
6. Claude spawns implementation sessions (new chat threads)
7. Each implementation agent works on one spec
8. Guardian validates after each implementation

This gives you the **interactive orchestration** you want while keeping agents focused on their boundaries.