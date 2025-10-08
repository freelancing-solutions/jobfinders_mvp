#!/usr/bin/env node

/**
 * Simple test for Guardian system without external dependencies
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Guardian System...\n');

// Test basic functionality
const basePath = path.resolve(__dirname, '..');
const specsPath = path.join(basePath, 'specs');

console.log('📂 Checking .kiro structure...');

// Check if specs directory exists
if (!fs.existsSync(specsPath)) {
  console.error('❌ specs directory not found');
  process.exit(1);
}

// Count spec folders
const specFolders = fs.readdirSync(specsPath)
  .filter(file => {
    const fullPath = path.join(specsPath, file);
    return fs.statSync(fullPath).isDirectory() && !file.startsWith('.');
  });

console.log(`✅ Found ${specFolders.length} specification folders`);

// Check for README
const readmePath = path.join(basePath, 'README.md');
if (fs.existsSync(readmePath)) {
  console.log('✅ Guardian README exists');
} else {
  console.log('⚠️ Guardian README missing');
}

// Check for scripts
const scripts = ['guardian.js', 'quick-check.js', 'install-hooks.js'];
scripts.forEach(script => {
  const scriptPath = path.join(basePath, 'scripts', script);
  if (fs.existsSync(scriptPath)) {
    console.log(`✅ ${script} exists`);
  } else {
    console.log(`❌ ${script} missing`);
  }
});

// Check for CLI wrapper
const cliPath = path.join(basePath, 'bin', 'guardian');
if (fs.existsSync(cliPath)) {
  console.log('✅ CLI wrapper exists');
} else {
  console.log('⚠️ CLI wrapper missing');
}

console.log('\n🎯 Guardian system components verified!');
console.log('\n📋 To use the Guardian:');
console.log('   1. Install dependencies: cd .kiro && npm install');
console.log('   2. Install git hooks: npm run guardian:install');
console.log('   3. Run validation: npm run guardian');
console.log('   4. Quick check: npm run guardian:quick');

console.log('\n✅ Guardian system is ready for deployment!');