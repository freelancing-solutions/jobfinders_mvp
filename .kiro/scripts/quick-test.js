#!/usr/bin/env node

/**
 * Quick test for the autonomous orchestrator path fix
 */

const fs = require('fs');
const path = require('path');

async function quickTest() {
  console.log('🧪 Quick Test: Autonomous Orchestrator Path Fix');
  console.log('='.repeat(50));

  const rootPath = process.cwd();
  console.log(`📁 Root path: ${rootPath}`);

  // Test 1: Check if guardian-simple.js exists and can be executed
  const guardianPath = path.join(rootPath, '.kiro', 'scripts', 'guardian-simple.js');
  console.log(`📋 Guardian path: ${guardianPath}`);
  console.log(`📋 Guardian exists: ${fs.existsSync(guardianPath)}`);

  if (fs.existsSync(guardianPath)) {
    try {
      const { execSync } = require('child_process');
      console.log('🔍 Testing Guardian execution...');

      const output = execSync(`node "${guardianPath}"`, {
        cwd: rootPath,
        encoding: 'utf8',
        timeout: 10000
      });

      console.log('✅ Guardian executed successfully');
      console.log(`📄 Guardian output length: ${output.length} characters`);

      if (output.includes('✅') || output.includes('No conflicts')) {
        console.log('✅ Guardian reports healthy state');
      } else if (output.includes('❌') || output.includes('CONFLICT')) {
        console.log('⚠️ Guardian reports issues (this is expected for testing)');
      }

    } catch (error) {
      console.error('❌ Guardian execution failed:', error.message);
      console.error('Exit code:', error.status);
    }
  }

  // Test 2: Check specs directory
  const specsDir = path.join(rootPath, '.kiro', 'specs');
  console.log(`📋 Specs directory: ${specsDir}`);
  console.log(`📋 Specs exists: ${fs.existsSync(specsDir)}`);

  if (fs.existsSync(specsDir)) {
    try {
      const specFolders = fs.readdirSync(specsDir)
        .filter(folder => !folder.startsWith('_') && !folder.startsWith('TEMPLATE'));

      console.log(`📊 Found ${specFolders.length} spec folders`);
      if (specFolders.length > 0) {
        console.log(`📝 Example specs: ${specFolders.slice(0, 3).join(', ')}`);
      }
    } catch (error) {
      console.error('❌ Error reading specs directory:', error.message);
    }
  }

  // Test 3: Try to load the autonomous orchestrator
  console.log('🔍 Testing Autonomous Orchestrator loading...');
  try {
    const AutonomousOrchestrator = require('./autonomous-orchestrator');
    console.log('✅ Autonomous Orchestrator loaded successfully');

    const orchestrator = new AutonomousOrchestrator();
    console.log('✅ Autonomous Orchestrator instantiated successfully');

    // Test one validation cycle
    console.log('🔍 Running single validation cycle...');
    const issues = await orchestrator.detectIssues();
    console.log(`✅ Validation completed - found ${issues.length} issues`);

    if (issues.length > 0) {
      console.log('📋 Issues found:');
      issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue.description} (${issue.severity})`);
      });
    }

    // Test pending specs detection
    console.log('🔍 Checking for pending specs...');
    const pendingSpecs = await orchestrator.getPendingSpecs();
    console.log(`✅ Found ${pendingSpecs.length} pending specs`);

    if (pendingSpecs.length > 0) {
      console.log('📋 Pending specs:');
      pendingSpecs.forEach((spec, index) => {
        console.log(`   ${index + 1}. ${spec.name} (${spec.priority})`);
      });
    }

    console.log('✅ Quick test completed successfully!');

  } catch (error) {
    console.error('❌ Autonomous Orchestrator test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

quickTest().catch(error => {
  console.error('❌ Quick test failed:', error.message);
  process.exit(1);
});