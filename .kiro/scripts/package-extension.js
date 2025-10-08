#!/usr/bin/env node

/**
 * Package the VSCode extension as VSIX
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function packageExtension() {
  console.log('📦 Packaging VSCode Extension');
  console.log('='.repeat(40));

  const rootPath = process.cwd();
  const extensionPath = path.join(rootPath, '.kiro', 'vscode-extension');

  if (!fs.existsSync(extensionPath)) {
    console.error('❌ Extension directory not found:', extensionPath);
    process.exit(1);
  }

  console.log('📁 Extension path:', extensionPath);

  // Check if vsce is available
  try {
    execSync('npx vsce --version', { stdio: 'pipe' });
    console.log('✅ vsce found');
  } catch (error) {
    console.log('📦 Installing vsce...');
    try {
      execSync('npm install -g @vscode/vsce', { stdio: 'inherit' });
      console.log('✅ vsce installed');
    } catch (installError) {
      console.error('❌ Failed to install vsce:', installError.message);
      console.log('💡 Please install manually: npm install -g @vscode/vsce');
      process.exit(1);
    }
  }

  // Package the extension
  try {
    console.log('📦 Packaging extension...');
    process.chdir(extensionPath);

    execSync('npx vsce package --no-yarn', { stdio: 'inherit' });

    console.log('✅ Extension packaged successfully!');

    // Find the generated VSIX file
    const files = fs.readdirSync(extensionPath).filter(file => file.endsWith('.vsix'));
    if (files.length > 0) {
      const vsixFile = files[0];
      const fullPath = path.join(extensionPath, vsixFile);
      console.log(`📦 Created: ${fullPath}`);
      console.log(`💡 Size: ${(fs.statSync(fullPath).size / 1024).toFixed(2)} KB`);

      console.log('\n🎯 Installation Instructions:');
      console.log(`1. Copy the VSIX file: ${fullPath}`);
      console.log('2. Open VSCode');
      console.log('3. Go to Extensions (Ctrl+Shift+X)');
      console.log('4. Click the "..." menu → "Install from VSIX..."');
      console.log(`5. Select: ${fullPath}`);
      console.log('6. Reload VSCode when prompted');
    }

  } catch (error) {
    console.error('❌ Failed to package extension:', error.message);
    process.exit(1);
  }
}

packageExtension().catch(error => {
  console.error('❌ Packaging failed:', error.message);
  process.exit(1);
});