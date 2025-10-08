#!/usr/bin/env node

/**
 * Test the Orchestrator system components
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Orchestrator System...\n');

const basePath = path.resolve(__dirname, '..');

// Test components
const components = [
  {
    name: 'Orchestrator Prompt',
    path: path.join(basePath, 'prompts', 'orchestrator.md'),
    required: true
  },
  {
    name: 'Implementation Agent Prompt',
    path: path.join(basePath, 'prompts', 'implementation-agent.md'),
    required: true
  },
  {
    name: 'Orchestration Script',
    path: path.join(basePath, 'scripts', 'orchestrate.js'),
    required: true
  },
  {
    name: 'Auto-Implementation Script',
    path: path.join(basePath, 'scripts', 'auto-implement.js'),
    required: true
  },
  {
    name: 'Guardian Script',
    path: path.join(basePath, 'scripts', 'guardian.js'),
    required: true
  },
  {
    name: 'Orchestrator README',
    path: path.join(basePath, 'ORCHESTRATOR-README.md'),
    required: false
  }
];

console.log('📋 Checking Orchestrator Components:');
console.log('='.repeat(50));

let allFound = true;

for (const component of components) {
  const exists = fs.existsSync(component.path);
  const status = exists ? '✅' : (component.required ? '❌' : '⚠️');

  console.log(`${status} ${component.name}`);

  if (!exists && component.required) {
    allFound = false;
    console.log(`   ❌ Missing: ${component.path}`);
  }
}

if (allFound) {
  console.log('\n✅ All required Orchestrator components found!');
} else {
  console.log('\n❌ Some required components are missing');
}

// Test spec directory structure
console.log('\n📁 Checking Spec Directory Structure:');
console.log('='.repeat(50));

const specsPath = path.join(basePath, 'specs');
if (fs.existsSync(specsPath)) {
  const specFolders = fs.readdirSync(specsPath)
    .filter(file => {
      const fullPath = path.join(specsPath, file);
      return fs.statSync(fullPath).isDirectory();
    })
    .filter(folder => !folder.startsWith('_'));

  console.log(`✅ Found ${specFolders.length} spec folders`);

  // Show some examples
  if (specFolders.length > 0) {
    console.log('   Example specs:');
    specFolders.slice(0, 5).forEach(folder => {
      const hasRequirements = fs.existsSync(path.join(specsPath, folder, 'requirements.md'));
      console.log(`   - ${folder} ${hasRequirements ? '✅' : '⚠️'}`);
    });

    if (specFolders.length > 5) {
      console.log(`   ... and ${specFolders.length - 5} more`);
    }
  }
} else {
  console.log('❌ Specs directory not found');
}

// Test architecture directory
console.log('\n🏗️ Checking Architecture Directory:');
console.log('='.repeat(50));

const archPath = path.join(basePath, 'architecture');
if (fs.existsSync(archPath)) {
  const archFiles = fs.readdirSync(archPath);
  console.log(`✅ Found ${archFiles.length} architecture files`);
} else {
  console.log('⚠️ Architecture directory not found');
}

// Test _CodeReviews directory
console.log('\n📝 Checking Code Reviews Directory:');
console.log('='.repeat(50));

const reviewsPath = path.join(basePath, '_CodeReviews');
if (fs.existsSync(reviewsPath)) {
  const reviews = fs.readdirSync(reviewsPath).filter(file => file.endsWith('.md'));
  console.log(`✅ Found ${reviews.length} code reviews`);
} else {
  console.log('ℹ️ Code reviews directory will be created when needed');
}

// Summary
console.log('\n📊 ORCHESTRATOR SYSTEM STATUS:');
console.log('='.repeat(50));

if (allFound && fs.existsSync(specsPath)) {
  console.log('✅ System is ready for orchestration!');
  console.log('');
  console.log('🚀 Available commands:');
  console.log('   npm run orchestrate              # Generate implementation plan');
  console.log('   npm run implement <spec-folder>  # Implement single feature');
  console.log('   npm run guardian                 # Validate specifications');
  console.log('');
  console.log('📖 Documentation:');
  console.log('   .kiro/ORCHESTRATOR-README.md    # Complete guide');
  console.log('   .kiro/README.md                  # Guardian documentation');
} else {
  console.log('⚠️ System needs attention before use');
}

console.log('\n🎯 Next Steps:');
console.log('1. Install dependencies: cd .kiro && npm install');
console.log('2. Run orchestration: npm run orchestrate');
console.log('3. Follow the generated plan');

console.log('\n✅ Orchestrator system test complete!');