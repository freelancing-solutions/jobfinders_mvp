# VSCode Extension Installation Guide

This guide will help you install the Autonomous Coder VSCode extension.

## 🚀 Quick Installation

### Step 1: Package the Extension

```bash
# From your project root directory
node .kiro/scripts/package-extension.js
```

This will create a `.vsix` file in `.kiro/vscode-extension/` directory.

### Step 2: Install in VSCode

1. **Open VSCode**
2. **Go to Extensions** (Ctrl+Shift+X or View → Extensions)
3. **Click the "..." menu** in the Extensions panel
4. **Select "Install from VSIX..."**
5. **Navigate to and select** the `.vsix` file created in Step 1
6. **Reload VSCode** when prompted

### Step 3: Verify Installation

1. **Open Command Palette** (Ctrl+Shift+P)
2. **Type "Autonomous Coder"** - you should see the available commands:
   - `Autonomous Coder: Process Job`
   - `Autonomous Coder: Start Orchestrator`
   - `Autonomous Coder: Show Active Jobs`

## 📋 Alternative Installation Methods

### Method A: Direct Installation from Source

If you prefer not to create a VSIX package:

1. **Open VSCode**
2. **Go to Extensions** (Ctrl+Shift+X)
3. **Click the "..." menu**
4. **Select "Install from Local..."**
5. **Navigate to** `.kiro/vscode-extension/` directory
6. **Select the** `package.json` file

### Method B: Command Line Installation

```bash
# Install directly using VSCode command
code --install-extension .kiro/vscode-extension/
```

## 🔧 Manual Installation (If All Else Fails)

If the automated methods don't work, you can install manually:

1. **Copy the extension files** to VSCode's extensions directory:
   - **Windows**: `%USERPROFILE%\.vscode\extensions\`
   - **Mac**: `~/.vscode/extensions/`
   - **Linux**: `~/.vscode/extensions/`

2. **Create a new folder** named `autonomous-coder-extension`

3. **Copy all files** from `.kiro/vscode-extension/` to this folder

4. **Restart VSCode**

## ✅ Verification

After installation, verify it works:

1. **Check the Extensions panel** - you should see "Autonomous Coder Extension" listed
2. **Open Command Palette** (Ctrl+Shift+P) and type "Autonomous Coder"
3. **Check the Output panel** - select "Autonomous Coder" from the dropdown

## 🚨 Troubleshooting

### Extension Not Showing in Commands

1. **Reload VSCode window** (Ctrl+Shift+P → "Developer: Reload Window")
2. **Check if extension is enabled** in Extensions panel
3. **Look for errors** in Help → Toggle Developer Tools → Console

### Installation Fails

1. **Check VSCode version** - requires VSCode 1.80.0 or higher
2. **Ensure Node.js is installed** - required for the orchestrator
3. **Check file permissions** - make sure the extension files are readable

### VSIX Creation Fails

1. **Install vsce globally**: `npm install -g @vscode/vsce`
2. **Check Node.js version** - requires Node 16 or higher
3. **Run from project root** - ensure you're in the correct directory

## 🎯 First Steps After Installation

Once installed:

1. **Start the orchestrator**:
   ```bash
   node .kiro/scripts/start-vscode-system.js
   ```

2. **Or use VSCode command**:
   - Open Command Palette (Ctrl+Shift+P)
   - Run "Autonomous Coder: Start Orchestrator"

3. **Test with a sample job**:
   - The orchestrator will create jobs in `.kiro/vscode-jobs/`
   - Use "Autonomous Coder: Process Job" to handle them

## 📚 Additional Resources

- [VSCode Extension API Documentation](https://code.visualstudio.com/api)
- [Extension Packaging Guide](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [VSCode Command Reference](https://code.visualstudio.com/api/references/commands)

If you encounter any issues, check the "Autonomous Coder" output channel in VSCode for detailed error messages.