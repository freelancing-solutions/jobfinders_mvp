# VSCode Extension Installation Steps

Since the automated packaging had an issue, here are the manual steps to install the extension:

## 🚀 Step 1: Fix and Package the Extension

### Option A: Use the Updated Script
```bash
node .kiro/scripts/package-extension-simple.js
```

### Option B: Manual Package Creation
```bash
# Navigate to extension directory
cd .kiro/vscode-extension

# Install vsce if not available
npm install -g @vscode/vsce

# Package with auto-accept
vsce package --no-yarn --no-verify
```

### Option C: Create ZIP and Rename to VSIX
```bash
# Navigate to extension directory
cd .kiro/vscode-extension

# Create a zip file
# (Use your system's zip tool or 7-Zip to zip all files)
# Name the resulting file: autonomous-coder-extension.vsix
```

## 🔧 Step 2: Install the VSIX File in VSCode

### Method 1: VSIX Installation (Recommended)
1. **Open VSCode**
2. **Go to Extensions** (Ctrl+Shift+X)
3. **Click the "..." menu** (top right of Extensions panel)
4. **Select "Install from VSIX..."**
5. **Navigate to** the `.vsix` file you created
6. **Select the file** and click "Install"
7. **Reload VSCode** when prompted

### Method 2: Command Line Installation
```bash
# From the project root directory
code --install-extension .kiro/vscode-extension/autonomous-coder-extension-0.0.1.vsix
```

### Method 3: Direct Installation (If VSIX fails)
1. **Copy extension folder** to VSCode extensions directory:
   - **Windows**: `%USERPROFILE%\.vscode\extensions\autonomous-coder-extension-0.0.1\`
   - **Mac**: `~/.vscode/extensions/autonomous-coder-extension-0.0.1/`
   - **Linux**: `~/.vscode/extensions/autonomous-coder-extension-0.0.1/`

2. **Copy all files** from `.kiro/vscode-extension/` to the new folder
3. **Restart VSCode**

## ✅ Step 3: Verify Installation

### Check Commands
1. **Open Command Palette** (Ctrl+Shift+P)
2. **Type "Autonomous Coder"** - you should see:
   - `Autonomous Coder: Process Job`
   - `Autonomous Coder: Start Orchestrator`
   - `Autonomous Coder: Show Active Jobs`

### Check Extensions Panel
1. **Go to Extensions** (Ctrl+Shift+X)
2. **Look for** "Autonomous Coder Extension" in the installed list
3. **Check for** any error indicators

### Check Output Channel
1. **Go to View → Output**
2. **Select** "Autonomous Coder" from the dropdown
3. **Look for** activation messages

## 🧪 Step 4: Test the Extension

### Create Test Job
```bash
# Run the test script to create a sample job
node .kiro/scripts/test-extension-setup.js
```

### Process Test Job
1. **Open Command Palette** (Ctrl+Shift+P)
2. **Run** "Autonomous Coder: Process Job"
3. **Follow the prompts** to process the sample job

### Start Orchestrator
1. **Open Command Palette** (Ctrl+Shift+P)
2. **Run** "Autonomous Coder: Start Orchestrator"
3. **Or start from terminal:**
   ```bash
   node .kiro/scripts/start-vscode-system.js
   ```

## 🚨 Troubleshooting

### Extension Not Loading
1. **Check VSCode version** - requires 1.80.0 or higher
2. **Reload VSCode window** (Ctrl+Shift+P → "Developer: Reload Window")
3. **Check Developer Tools** for errors (Help → Toggle Developer Tools)
4. **Look at** the "Autonomous Coder" output channel

### Commands Not Working
1. **Check if extension is enabled** in Extensions panel
2. **Restart VSCode** completely
3. **Disable and re-enable** the extension

### Packaging Issues
1. **Install vsce globally:** `npm install -g @vscode/vsce`
2. **Check Node.js version** - requires 16+
3. **Run from project root directory**

### Claude Code Integration
1. **Ensure Claude Code extension** is installed and active
2. **Check you're logged into** Claude Code
3. **Try opening Claude Code** manually first

## 🎯 Quick Start Checklist

- [ ] Extension installed successfully
- [ ] Commands appear in Command Palette
- [ ] Output channel shows activation messages
- [ ] Sample job can be processed
- [ ] Orchestrator can be started
- [ ] Claude Code integration works

Once all these are checked, your autonomous coder system is ready to use!