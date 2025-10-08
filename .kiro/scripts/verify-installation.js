#!/usr/bin/env node

/**
 * Verify complete installation of Guardian and Orchestrator system
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Orchestrator Installation');
console.log('='.repeat(50));

const basePath = path.resolve(__dirname, '..');

// Check all components
const components = [
  {
    category: 'Core Scripts',
    files: [
      'scripts/guardian.js',
      'scripts/guardian-simple.js',
      'scripts/quick-check.js',
      'scripts/orchestrate.js',
      'scripts/auto-implement.js',
      'scripts/install-hooks.js'
    ]
  },
  {
    category: 'Agent Prompts',
    files: [
      'prompts/guardian.md',
      'prompts/orchestrator.md',
      'prompts/implementation-agent.md'
    ]
  },
  {
    category: 'Documentation',
    files: [
      'README.md',
      'ORCHESTRATOR-README.md',
      'package.json'
    ]
  },
  {
    category: 'Test Scripts',
    files: [
      'scripts/test-guardian.js',
      'scripts/test-orchestrator.js',
      'scripts/install-dependencies.js'
    ]
  }
];

let allGood = true;
console.log('📋 Checking Components:\n');

for (const category of components) {
  console.log(`📁 ${category.category}:`);

  for (const file of category.files) {
    const filePath = path.join(basePath, file);
    const exists = fs.existsSync(filePath);
    const status = exists ? '✅' : '❌';

    console.log(`  ${status} ${file}`);

    if (!exists) {
      allGood = false;
    }
  }
  console.log('');
}

// Check spec directory
console.log('📋 Checking Project Structure:');
console.log('');

const specsPath = path.join(basePath, 'specs');
if (fs.existsSync(specsPath)) {
  const specFolders = fs.readdirSync(specsPath)
    .filter(file => {
      const fullPath = path.join(specsPath, file);
      return fs.statSync(fullPath).isDirectory();
    })
    .filter(folder => !folder.startsWith('_') && folder !== 'TEMPLATE');

  console.log(`✅ Found ${specFolders.length} active spec folders`);

  if (specFolders.length > 0) {
    console.log('   Sample specs:');
    specFolders.slice(0, 3).forEach(folder => {
      const hasRequirements = fs.existsSync(path.join(specsPath, folder, 'requirements.md'));
      console.log(`   - ${folder} ${hasRequirements ? '✅' : '⚠️'}`);
    });
  }
} else {
  console.log('❌ Specs directory not found');
  allGood = false;
}

// Check architecture directory
const archPath = path.join(basePath, 'architecture');
if (fs.existsSync(archPath)) {
  const archFiles = fs.readdirSync(archPath);
  console.log(`✅ Found ${archFiles.length} architecture files`);
} else {
  console.log('⚠️ Architecture directory not found (optional)');
}

// Check package.json
const packageJsonPath = path.join(basePath, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const scripts = packageJson.scripts || {};

    console.log('✅ Package.json found with scripts:');
    Object.keys(scripts).forEach(script => {
      console.log(`   - npm run ${script}`);
    });
  } catch (error) {
    console.log('❌ Invalid package.json');
    allGood = false;
  }
} else {
  console.log('❌ package.json not found');
  allGood = false;
}

console.log('');
console.log('='.repeat(50));
console.log('📊 INSTALLATION STATUS');
console.log('='.repeat(50));

if (allGood) {
  console.log('✅ Installation Complete!');
  console.log('');
  console.log('🚀 Ready to use:');
  console.log('');
  console.log('Basic Commands (no dependencies):');
  console.log('  node .kiro/scripts/guardian-simple.js      # Validate specs');
  console.log('  node .kiro/scripts/orchestrate.js          # Generate plan');
  console.log('  node .kiro/scripts/test-orchestrator.js    # Test system');
  console.log('');
  console.log('Full Commands (requires npm install):');
  console.log('  cd .kiro && npm install                    # Install dependencies');
  console.log('  npm run guardian                            # Full validation');
  console.log('  npm run orchestrate                         # Generate plan');
  console.log('  npm run implement <spec>                    # Implement feature');
  console.log('');
  console.log('📖 Documentation:');
  console.log('  .kiro/README.md                    # Guardian guide');
  console.log('  .kiro/ORCHESTRATOR-README.md       # Orchestrator guide');
  console.log('  INSTALL-ORCHESTRATOR.md            # Installation guide');
} else {
  console.log('⚠️ Installation Issues Detected');
  console.log('');
  console.log('❌ Missing components will limit functionality');
  console.log('💡 Check the ❌ items above and fix missing files');
}

console.log('');
console.log('🎯 Next Steps:');
console.log('1. Test basic validation: node .kiro/scripts/guardian-simple.js');
console.log('2. Generate implementation plan: node .kiro/scripts/orchestrate.js');
console.log('3. (Optional) Install full dependencies: cd .kiro && npm install');

console.log('\n✅ Installation verification complete!');