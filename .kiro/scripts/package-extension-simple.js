#!/usr/bin/env node

/**
 * Simple VSCode Extension Packager
 * Creates a VSIX file without interactive prompts
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function packageExtension() {
  console.log('📦 Packaging VSCode Extension (Simple Method)');
  console.log('='.repeat(50));

  const rootPath = process.cwd();
  const extensionPath = path.join(rootPath, '.kiro', 'vscode-extension');

  if (!fs.existsSync(extensionPath)) {
    console.error('❌ Extension directory not found:', extensionPath);
    process.exit(1);
  }

  console.log('📁 Extension path:', extensionPath);

  // Create a temporary package.json with all required fields
  const packageJsonPath = path.join(extensionPath, 'package.json');
  const originalPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // Ensure all required fields are present
  const completePackageJson = {
    ...originalPackageJson,
    repository: {
      type: "git",
      url: "https://github.com/jobfinders/autonomous-coder-extension"
    },
    homepage: "https://github.com/jobfinders/autonomous-coder-extension#readme",
    bugs: {
      url: "https://github.com/jobfinders/autonomous-coder-extension/issues"
    }
  };

  // Write the complete package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(completePackageJson, null, 2));
  console.log('✅ Updated package.json with required fields');

  try {
    console.log('📦 Creating VSIX package...');
    process.chdir(extensionPath);

    // Use vsce with --no-verify and --no-yarn to avoid prompts
    execSync('npx vsce package --no-yarn --no-verify', { stdio: 'inherit' });

    console.log('✅ Extension packaged successfully!');

    // Find the generated VSIX file
    const files = fs.readdirSync(extensionPath).filter(file => file.endsWith('.vsix'));
    if (files.length > 0) {
      const vsixFile = files[0];
      const fullPath = path.join(extensionPath, vsixFile);
      const stats = fs.statSync(fullPath);

      console.log(`\n📦 Package created: ${fullPath}`);
      console.log(`📦 File size: ${(stats.size / 1024).toFixed(2)} KB`);
      console.log(`📦 Created: ${stats.mtime.toLocaleString()}`);

      console.log('\n🎯 Installation Instructions:');
      console.log('1. Open VSCode');
      console.log('2. Go to Extensions (Ctrl+Shift+X)');
      console.log('3. Click the "..." menu → "Install from VSIX..."');
      console.log(`4. Select: ${fullPath}`);
      console.log('5. Reload VSCode when prompted');

      console.log('\n🚀 Alternative Installation:');
      console.log(`code --install-extension "${fullPath}"`);

      return fullPath;
    } else {
      console.log('❌ No VSIX file was created');
      return null;
    }

  } catch (error) {
    console.error('❌ Failed to package extension:', error.message);

    // Restore original package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(originalPackageJson, null, 2));
    console.log('📝 Restored original package.json');

    process.exit(1);
  }
}

// Create a simple manual packaging method if vsce fails
function createManualPackage() {
  console.log('\n🔄 Creating manual VSIX package...');

  const rootPath = process.cwd();
  const extensionPath = path.join(rootPath, '.kiro', 'vscode-extension');

  try {
    // Create a simple zip file with the extension contents
    const zipPath = path.join(extensionPath, 'autonomous-coder-extension.zip');

    console.log('📦 Creating ZIP archive...');

    // Simple zip creation using Node.js (basic implementation)
    const archiver = require('archiver');
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`✅ Manual package created: ${zipPath}`);
      console.log(`💡 Size: ${(archive.pointer() / 1024).toFixed(2)} KB`);

      // Rename to .vsix
      const vsixPath = zipPath.replace('.zip', '.vsix');
      fs.renameSync(zipPath, vsixPath);
      console.log(`📦 Renamed to: ${vsixPath}`);

      console.log('\n🎯 Manual Installation:');
      console.log('1. Rename the file to .vsix if needed');
      console.log('2. Install in VSCode using "Install from VSIX..."');
    });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(output);
    archive.directory(extensionPath, false);
    archive.finalize();

  } catch (error) {
    console.log('⚠️ Manual packaging failed:', error.message);
    console.log('💡 Please install the extension directly from source:');
    console.log('   1. Copy .kiro/vscode-extension/ to VSCode extensions directory');
    console.log('   2. Reload VSCode');
  }
}

async function main() {
  try {
    const vsixPath = await packageExtension();

    if (vsixPath) {
      console.log('\n🎉 Extension packaging completed successfully!');
      console.log(`📦 VSIX file: ${vsixPath}`);
    }
  } catch (error) {
    console.log('\n⚠️ Automatic packaging failed, trying manual method...');
    createManualPackage();
  }
}

main().catch(error => {
  console.error('❌ Packaging script failed:', error.message);
  process.exit(1);
});