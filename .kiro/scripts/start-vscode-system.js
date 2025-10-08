#!/usr/bin/env node

/**
 * Start the VSCode-based Autonomous System
 * Uses VSCode internal commands instead of spawning Claude Code processes
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

async function main() {
  console.log('🚀 Starting VSCode-based Autonomous System');
  console.log('='.repeat(50));

  // Check if the VSCode orchestrator exists
  const orchestratorPath = path.join(ROOT, '.kiro', 'scripts', 'vscode-orchestrator.js');
  if (!fs.existsSync(orchestratorPath)) {
    console.error('❌ VSCode orchestrator not found at:', orchestratorPath);
    process.exit(1);
  }

  // Check if VSCode extension exists
  const extensionPath = path.join(ROOT, '.kiro', 'vscode-extension');
  if (!fs.existsSync(extensionPath)) {
    console.error('❌ VSCode extension not found at:', extensionPath);
    process.exit(1);
  }

  console.log('✅ Components verified');
  console.log('');
  console.log('📋 To use the VSCode-based autonomous system:');
  console.log('');
  console.log('1. Install the VSCode extension:');
  console.log('   - Open VSCode');
  console.log('   - Go to Extensions (Ctrl+Shift+X)');
  console.log('   - Click "Install from VSIX..."');
  console.log(`   - Select: ${path.join(extensionPath, 'package.json')}`);
  console.log('');
  console.log('2. Start the orchestrator:');
  console.log('   - Open Command Palette (Ctrl+Shift+P)');
  console.log('   - Run: "Autonomous Coder: Start Orchestrator"');
  console.log('   - OR run this script directly:');
  console.log(`     node "${orchestratorPath}"`);
  console.log('');
  console.log('3. Process jobs manually:');
  console.log('   - Open Command Palette (Ctrl+Shift+P)');
  console.log('   - Run: "Autonomous Coder: Process Job"');
  console.log('');
  console.log('4. Monitor active jobs:');
  console.log('   - Open Command Palette (Ctrl+Shift+P)');
  console.log('   - Run: "Autonomous Coder: Show Active Jobs"');
  console.log('');
  console.log('💡 The VSCode orchestrator will create job files that the extension can pick up and process.');
  console.log('💡 This avoids authentication and JSON parsing issues with direct Claude Code spawning.');

  // Start the orchestrator
  console.log('');
  console.log('🚀 Starting VSCode orchestrator...');
  const VSCodeOrchestrator = require('./vscode-orchestrator');

  const orchestrator = new VSCodeOrchestrator();
  await orchestrator.start();
}

main().catch(error => {
  console.error('❌ System startup failed:', error.message);
  process.exit(1);
});