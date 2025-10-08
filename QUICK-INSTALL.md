# Quick Extension Installation (Windows)

Since the automated scripts are having path issues, here's the fastest way to install the extension:

## 🚀 Method 1: Create VSIX Manually (Recommended)

### Step 1: Create VSIX File
1. **Open File Explorer** and navigate to: `E:\projects\jobfinders_mvp\.kiro\vscode-extension\`
2. **Select all files** in that directory (Ctrl+A)
3. **Right-click** → "Send to" → "Compressed (zipped) folder"
4. **Rename** the created zip file to: `autonomous-coder-extension-0.0.1.vsix`

### Step 2: Install in VSCode
1. **Open VSCode**
2. **Go to Extensions** (Ctrl+Shift+X)
3. **Click the "..." menu** (top right of Extensions panel)
4. **Select "Install from VSIX..."**
5. **Navigate to** the `.vsix` file you just created
6. **Select the file** and click "Install"
7. **Reload VSCode** when prompted

## 🔧 Method 2: Command Line (if you prefer)

### PowerShell Commands
```powershell
# Navigate to extension directory
cd "E:\projects\jobfinders_mvp\.kiro\vscode-extension\"

# Create zip file
Compress-Archive -Path * -DestinationPath "autonomous-coder-extension-0.0.1.vsix" -Force

# Install extension
code --install-extension "autonomous-coder-extension-0.0.1.vsix"
```

## 📦 Method 3: Direct Installation (No VSIX)

### Copy to VSCode Extensions Directory
1. **Navigate to** your VSCode extensions folder:
   ```
   C:\Users\Mothetho\.vscode\extensions\
   ```

2. **Create a new folder** named:
   ```
   autonomous-coder-extension-0.0.1
   ```

3. **Copy all files** from:
   ```
   E:\projects\jobfinders_mvp\.kiro\vscode-extension\
   ```

   To the new folder you created.

4. **Restart VSCode**

## ✅ Verification

After installation, verify it works:

1. **Open Command Palette** (Ctrl+Shift+P)
2. **Type "Autonomous Coder"** - you should see:
   - `Autonomous Coder: Process Job`
   - `Autonomous Coder: Start Orchestrator`
   - `Autonomous Coder: Show Active Jobs`

3. **Check Extensions panel** - should show "Autonomous Coder Extension"

## 🧪 Test the Extension

### Create Test Job
```bash
# From project root in terminal
node .kiro/scripts/test-extension-setup.js
```

### Start the System
```bash
# Start the VSCode orchestrator
node .kiro/scripts/start-vscode-system.js
```

### Process Jobs in VSCode
1. **Open Command Palette** (Ctrl+Shift+P)
2. **Run "Autonomous Coder: Process Job"**
3. **Follow the prompts** to process the sample job

## 🎯 What Should Happen

Once installed and working:
- ✅ Extension appears in VSCode Extensions panel
- ✅ Commands appear in Command Palette
- ✅ "Autonomous Coder" output channel shows activation messages
- ✅ Jobs are processed when you run "Process Job" command
- ✅ Orchestrator can be started from VSCode command

## 🚨 If It Doesn't Work

### Extension Not Loading
1. **Reload VSCode window**: Ctrl+Shift+P → "Developer: Reload Window"
2. **Check VSCode version**: Must be 1.80.0 or higher
3. **Look at Developer Tools**: Help → Toggle Developer Tools → Console

### Commands Not Visible
1. **Disable and re-enable** the extension in Extensions panel
2. **Restart VSCode completely**
3. **Check Output Channel**: View → Output → "Autonomous Coder"

### Claude Code Issues
1. **Ensure Claude Code extension** is installed and active
2. **Make sure you're logged in** to Claude Code
3. **Try opening Claude Code** manually first

## 🎉 Success!

When everything is working, you'll have a fully functional autonomous coder system that:
- Detects issues in your codebase
- Creates jobs automatically
- Lets you process them through Claude Code
- Tracks active jobs and their status

The manual installation method should work even if the automated scripts have path issues!