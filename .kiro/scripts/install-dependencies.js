#!/usr/bin/env node

/**
 * Install Guardian and Orchestrator dependencies
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Installing Guardian & Orchestrator System...\n');

const basePath = path.resolve(__dirname, '..');
const packageJsonPath = path.join(basePath, 'package.json');

// Check if package.json exists
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ package.json not found');
  process.exit(1);
}

console.log('📦 Found package.json');
console.log('📁 Installation directory:', basePath);
console.log('');

console.log('📋 Dependencies to install:');
console.log('  - js-yaml: For parsing configuration files');
console.log('  - commander: For CLI interface');
console.log('');

console.log('💡 To complete installation, run:');
console.log('');
console.log('   cd .kiro');
console.log('   npm install');
console.log('');
console.log('Or from project root:');
console.log('');
console.log('   cd .kiro && npm install && cd ..');
console.log('');

console.log('🧪 After installation, test with:');
console.log('');
console.log('   npm run test-guardian');
console.log('   npm run test-orchestrator');
console.log('');

// Test basic components
console.log('🔍 Pre-installation check:');
console.log('='.repeat(40));

const components = [
  { name: 'Guardian Script', path: 'scripts/guardian.js' },
  { name: 'Quick Check Script', path: 'scripts/quick-check.js' },
  { name: 'Orchestrate Script', path: 'scripts/orchestrate.js' },
  { name: 'Implementation Script', path: 'scripts/auto-implement.js' },
  { name: 'Guardian Prompt', path: 'prompts/guardian.md' },
  { name: 'Orchestrator Prompt', path: 'prompts/orchestrator.md' },
  { name: 'Implementation Agent Prompt', path: 'prompts/implementation-agent.md' }
];

let allFound = true;

for (const component of components) {
  const componentPath = path.join(basePath, component.path);
  const exists = fs.existsSync(componentPath);
  console.log(`${exists ? '✅' : '❌'} ${component.name}`);
  if (!exists) {
    allFound = false;
  }
}

if (allFound) {
  console.log('\n✅ All components present - ready for installation!');
} else {
  console.log('\n⚠️  Some components missing - installation may fail');
}

console.log('\n🎯 Next steps:');
console.log('1. Install dependencies: cd .kiro && npm install');
console.log('2. Install git hooks: npm run guardian:install');
console.log('3. Test system: npm run test-guardian');
console.log('4. Generate plan: npm run orchestrate');