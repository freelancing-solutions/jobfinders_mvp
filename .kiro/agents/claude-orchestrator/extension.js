const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

async function processQueueFile(uri) {
  try {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
      vscode.window.showErrorMessage('No workspace folder found.');
      return;
    }

    const filePath = uri.fsPath;
    const raw = fs.readFileSync(filePath, 'utf8');
    const job = JSON.parse(raw);
    
    // Build final prompt: prefer inlinePrompt, otherwise read from promptPath
    let promptText = '';
    if (job.inlinePrompt && typeof job.inlinePrompt === 'string') {
      promptText = job.inlinePrompt;
    } else if (job.promptPath) {
      const promptPath = path.isAbsolute(job.promptPath)
        ? job.promptPath
        : path.join(workspaceRoot, job.promptPath);
      if (!fs.existsSync(promptPath)) {
        vscode.window.showErrorMessage('Prompt file not found: ' + promptPath);
        return;
      }
      promptText = fs.readFileSync(promptPath, 'utf8');
    } else {
      vscode.window.showErrorMessage('No prompt provided in job file.');
      return;
    }

    // Open chat and send the prompt automatically
    try {
      // Try Claude-specific commands first if available
      try {
        await vscode.commands.executeCommand('claude.chat.open', { query: promptText });
        await vscode.commands.executeCommand('claude.chat.sendMessage', { message: promptText });
      } catch (_) {
        // Fallback to VS Code Chat with query + accept input
        await vscode.commands.executeCommand('workbench.action.chat.open', {
          query: promptText,
          isPartialQuery: false
        });
        // Give UI a moment, then try to send
        await new Promise(r => setTimeout(r, 300));
        try { await vscode.commands.executeCommand('workbench.action.chat.acceptInput'); } catch {}
      }
    } catch (e) {
      // Fallback: open chat without parameters
      await vscode.commands.executeCommand('workbench.action.chat.open');
      // If provider does not support direct send, place text to clipboard for paste
      await vscode.env.clipboard.writeText(promptText);
    }

    // Attach declared context files
    const attachments = Array.isArray(job.attachments) ? job.attachments : [];
    // Instead of relying solely on attachment commands (which may not be available),
    // read content and inline it into the message for reliability.
    try {
      let appendedContext = '';
      for (const item of attachments) {
        const resolved = path.isAbsolute(item) ? item : path.join(workspaceRoot, item);
        if (!fs.existsSync(resolved)) continue;
        const stat = fs.statSync(resolved);
        if (stat.isDirectory()) {
          const entries = fs.readdirSync(resolved);
          for (const entry of entries) {
            const full = path.join(resolved, entry);
            if (fs.existsSync(full) && fs.statSync(full).isFile()) {
              const content = fs.readFileSync(full, 'utf8');
              appendedContext += `\n\n<<<FILE:${path.relative(workspaceRoot, full)}>>>\n${truncateContent(content)}\n<<<END>>>\n`;
            }
          }
        } else {
          const content = fs.readFileSync(resolved, 'utf8');
          appendedContext += `\n\n<<<FILE:${path.relative(workspaceRoot, resolved)}>>>\n${truncateContent(content)}\n<<<END>>>\n`;
        }
      }

      if (appendedContext) {
        const fullMessage = `${promptText}\n\n${appendedContext}`;
        try {
          await vscode.commands.executeCommand('claude.chat.sendMessage', { message: fullMessage });
        } catch (_) {
          // Fallback to VS Code Chat accept input route
          await vscode.commands.executeCommand('workbench.action.chat.open', {
            query: fullMessage,
            isPartialQuery: false
          });
          await new Promise(r => setTimeout(r, 300));
          try { await vscode.commands.executeCommand('workbench.action.chat.acceptInput'); } catch {}
        }
      }
    } catch {}

    // Cleanup job file after processing to avoid re-runs
    try { fs.unlinkSync(filePath); } catch {}

    vscode.window.showInformationMessage('🤖 Orchestrator job executed: ' + (job.specName || path.basename(promptPath)));
  } catch (err) {
    vscode.window.showErrorMessage('Failed to process orchestrator job: ' + (err?.message || String(err)));
  }
}

function truncateContent(text, maxLength = 100000) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + `\n...[truncated ${text.length - maxLength} chars]`;
}

async function openClaudeWithPrompt() {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) {
    vscode.window.showErrorMessage('No workspace folder found.');
    return;
  }

  const promptsDir = path.join(workspaceRoot, '.kiro', 'prompts');
  const specsDir = path.join(workspaceRoot, '.kiro', 'specs');

  if (!fs.existsSync(promptsDir)) {
    vscode.window.showErrorMessage('Prompts directory not found: ' + promptsDir);
    return;
  }

  // Find available worker prompts
  const promptFiles = fs.readdirSync(promptsDir)
    .filter(f => f.startsWith('worker-') && f.endsWith('.md'))
    .sort();

  if (promptFiles.length === 0) {
    vscode.window.showWarningMessage('No worker-* prompts found in ' + promptsDir);
    return;
  }

  const selectedPromptFile = await vscode.window.showQuickPick(promptFiles, {
    placeHolder: 'Select worker prompt to open in Claude chat'
  });

  if (!selectedPromptFile) return;

  const promptPath = path.join(promptsDir, selectedPromptFile);
  const promptText = fs.readFileSync(promptPath, 'utf8');

  // Derive spec name from prompt filename (worker-<spec>.md)
  const specName = selectedPromptFile.replace(/^worker-/, '').replace(/\.md$/, '');
  const specPath = path.join(specsDir, specName);

  // Open Claude chat panel in this instance
  try {
    await vscode.commands.executeCommand('workbench.action.chat.open');
  } catch (e) {
    // If the command isn't available, just open the panel for the built-in chat view
  }

  // Copy prompt to clipboard for immediate paste
  await vscode.env.clipboard.writeText(promptText);
  vscode.window.showInformationMessage('Prompt copied to clipboard. Paste into Claude chat to start.');

  // Attach common spec context files if present
  const contextFiles = ['requirements.md', 'design.md', 'tasks.md']
    .map(n => path.join(specPath, n))
    .filter(p => fs.existsSync(p));

  for (const file of contextFiles) {
    try {
      await vscode.commands.executeCommand('workbench.action.chat.attachContext', {
        uri: vscode.Uri.file(file)
      });
    } catch (e) {
      // Best-effort attachment; continue
    }
  }

  vscode.window.showInformationMessage(`Claude chat prepared for spec: ${specName}`);
}

function activate(context) {
  // Manual command (still available)
  const disposable = vscode.commands.registerCommand('jobfinders.openClaudeChat', openClaudeWithPrompt);
  context.subscriptions.push(disposable);

  // Autonomous queue watcher: picks up JSON jobs and executes them automatically
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (workspaceRoot) {
    const queueDir = path.join(workspaceRoot, '.kiro', 'agents', 'claude-orchestrator', 'queue');
    try { if (!fs.existsSync(queueDir)) fs.mkdirSync(queueDir, { recursive: true }); } catch {}

    const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(queueDir, '*.json'));
    watcher.onDidCreate((uri) => processQueueFile(uri));
    watcher.onDidChange((uri) => processQueueFile(uri));
    context.subscriptions.push(watcher);
  }
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};