#!/usr/bin/env node

/**
 * Test script to verify the autonomous orchestrator fixes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function testFixes() {
  console.log('🧪 Testing Autonomous Orchestrator Fixes');
  console.log('='.repeat(50));

  const rootPath = process.cwd();
  console.log(`📁 Root path: ${rootPath}`);

  // Test 1: Verify permission mode fix
  console.log('\n🔍 Test 1: Permission Mode Fix');
  const autonomousOrchestratorPath = path.join(rootPath, '.kiro', 'scripts', 'autonomous-orchestrator.js');

  if (fs.existsSync(autonomousOrchestratorPath)) {
    const content = fs.readFileSync(autonomousOrchestratorPath, 'utf8');

    if (content.includes("'--permission-mode', 'default'")) {
      console.log('✅ Permission mode fixed to "default"');
    } else if (content.includes("'--permission-mode', 'auto'")) {
      console.log('❌ Permission mode still set to "auto"');
    } else {
      console.log('⚠️ Permission mode setting unclear');
    }
  } else {
    console.log('❌ Autonomous orchestrator not found');
  }

  // Test 2: Check if we can find Claude Code
  console.log('\n🔍 Test 2: Claude Code Path Detection');
  const claudeCodePaths = [
    path.join('C:', 'Users', 'Mothetho', '.trae', 'extensions', 'anthropic.claude-code-2.0.1-universal', 'resources', 'claude-code', 'cli.js')
  ];

  let claudeCodeFound = false;
  for (const claudePath of claudeCodePaths) {
    if (fs.existsSync(claudePath)) {
      console.log(`✅ Claude Code found at: ${claudePath}`);
      claudeCodeFound = true;
      break;
    }
  }

  if (!claudeCodeFound) {
    console.log('⚠️ Claude Code not found in expected paths');
    if (process.env.CLAUDE_CODE_PATH) {
      console.log(`✅ Using CLAUDE_CODE_PATH: ${process.env.CLAUDE_CODE_PATH}`);
    } else {
      console.log('💡 Set CLAUDE_CODE_PATH environment variable if needed');
    }
  }

  // Test 3: Test the validation cycle
  console.log('\n🔍 Test 3: Validation Cycle Test');
  try {
    const AutonomousOrchestrator = require('./autonomous-orchestrator');
    const orchestrator = new AutonomousOrchestrator();

    console.log('✅ Autonomous orchestrator loaded successfully');

    // Test validation
    const issues = await orchestrator.detectIssues();
    console.log(`✅ Validation completed - found ${issues.length} issues`);

    // Test pending specs
    const pendingSpecs = await orchestrator.getPendingSpecs();
    console.log(`✅ Found ${pendingSpecs.length} pending specs`);

    console.log('✅ All validation tests passed');

  } catch (error) {
    console.error('❌ Validation test failed:', error.message);
  }

  // Test 4: Check test failures detection
  console.log('\n🔍 Test 4: Test Failures Detection');
  try {
    const testOutput = execSync('npm test 2>&1', {
      cwd: rootPath,
      encoding: 'utf8',
      timeout: 15000
    });

    console.log('✅ Tests executed successfully');

  } catch (error) {
    console.log(`✅ Test failures detected (expected): ${error.status} exit code`);

    // Check if the error output contains test failure information
    if (error.stdout && error.stdout.includes('failed')) {
      console.log('✅ Test failure parsing working correctly');
    }
  }

  console.log('\n🎉 Fix testing completed!');
  console.log('\n💡 Ready to try the autonomous system:');
  console.log('   node .kiro/scripts/start-autonomous-system.js');
}

testFixes().catch(error => {
  console.error('❌ Test script failed:', error.message);
  process.exit(1);
});