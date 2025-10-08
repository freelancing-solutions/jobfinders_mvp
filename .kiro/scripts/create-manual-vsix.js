#!/usr/bin/env node

/**
 * Create VSIX file manually by zipping the extension
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function createManualVSIX() {
  console.log('📦 Creating Manual VSIX Package');
  console.log('='.repeat(40));

  const rootPath = process.cwd();
  const extensionPath = path.join(rootPath, '.kiro', 'vscode-extension');
  const outputPath = path.join(extensionPath, 'autonomous-coder-extension-0.0.1.vsix');

  if (!fs.existsSync(extensionPath)) {
    console.error('❌ Extension directory not found:', extensionPath);
    process.exit(1);
  }

  console.log('📁 Extension path:', extensionPath);
  console.log('📦 Output path:', outputPath);

  // Create a temporary directory for the package structure
  const tempDir = path.join(extensionPath, 'temp-package');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    // Copy extension files to temp directory
    console.log('📋 Copying extension files...');
    const filesToCopy = [
      'package.json',
      'extension.js',
      'README.md',
      'vscodeignore'
    ];

    for (const file of filesToCopy) {
      const srcPath = path.join(extensionPath, file);
      const destPath = path.join(tempDir, file);

      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`   ✅ Copied: ${file}`);
      } else {
        console.log(`   ⚠️ Skipped: ${file} (not found)`);
      }
    }

    // Create the VSIX by creating a zip file
    console.log('🗜️ Creating VSIX archive...');

    // Try different methods to create the zip
    let success = false;

    // Method 1: Use PowerShell (Windows)
    if (process.platform === 'win32') {
      try {
        const psCommand = `Compress-Archive -Path "${tempDir}\\*" -DestinationPath "${outputPath}" -Force`;
        execSync(`powershell -Command "${psCommand}"`, { stdio: 'pipe' });
        console.log('   ✅ Created using PowerShell Compress-Archive');
        success = true;
      } catch (error) {
        console.log('   ⚠️ PowerShell method failed:', error.message);
      }
    }

    // Method 2: Use tar (macOS/Linux)
    if (!success && (process.platform === 'darwin' || process.platform === 'linux')) {
      try {
        execSync(`tar -czf "${outputPath}" -C "${tempDir}" .`, { stdio: 'pipe' });
        console.log('   ✅ Created using tar');
        success = true;
      } catch (error) {
        console.log('   ⚠️ tar method failed:', error.message);
      }
    }

    // Method 3: Manual node-based zip
    if (!success) {
      try {
        const archiver = require('archiver');
        const output = fs.createWriteStream(outputPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
          console.log(`   ✅ Created using archiver: ${(archive.pointer() / 1024).toFixed(2)} KB`);
        });

        archive.on('error', (err) => {
          throw err;
        });

        archive.pipe(output);
        archive.directory(tempDir, false);
        archive.finalize();

        // Wait for archive to complete
        return new Promise((resolve) => {
          output.on('close', () => {
            cleanupAndReport(outputPath);
            resolve();
          });
        });

      } catch (error) {
        console.log('   ⚠️ archiver method failed:', error.message);
      }
    }

    if (success) {
      cleanupAndReport(outputPath);
    }

  } catch (error) {
    console.error('❌ Failed to create VSIX:', error.message);
  } finally {
    // Cleanup temp directory
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log('🧹 Cleaned up temporary files');
      }
    } catch (error) {
      console.warn('⚠️ Failed to cleanup temp files:', error.message);
    }
  }
}

function cleanupAndReport(outputPath) {
  if (fs.existsSync(outputPath)) {
    const stats = fs.statSync(outputPath);
    console.log('✅ VSIX package created successfully!');
    console.log(`📦 File: ${outputPath}`);
    console.log(`📦 Size: ${(stats.size / 1024).toFixed(2)} KB`);

    console.log('\n🎯 Installation Instructions:');
    console.log('1. Open VSCode');
    console.log('2. Go to Extensions (Ctrl+Shift+X)');
    console.log('3. Click the "..." menu → "Install from VSIX..."');
    console.log(`4. Select: ${outputPath}`);
    console.log('5. Reload VSCode when prompted');

    console.log('\n🚀 Command Line Installation:');
    console.log(`code --install-extension "${outputPath}"`);
  } else {
    console.log('❌ VSIX file was not created');
  }
}

// Main execution
if (require.main === module) {
  createManualVSIX();
}

module.exports = { createManualVSIX };