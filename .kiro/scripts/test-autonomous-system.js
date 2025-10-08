#!/usr/bin/env node

/**
 * Test the Autonomous Coder System
 * Creates test issues to verify agents are launched properly
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

async function createTestIssue() {
  console.log('🧪 Creating test issue for autonomous system...');

  // Create a TypeScript error by introducing invalid syntax
  const testFile = path.join(ROOT, 'src', 'test-file.ts');
  const invalidContent = `
// This is a test file with intentional errors
import { something } from 'nonexistent-module';

const invalid: string = 123; // Type error

function testFunction(): never {
  // This function should return never but returns undefined
  return undefined;
}
`;

  try {
    fs.writeFileSync(testFile, invalidContent);
    console.log('✅ Created test file with TypeScript errors:', testFile);
    return true;
  } catch (error) {
    console.error('❌ Failed to create test file:', error.message);
    return false;
  }
}

async function createTestSpec() {
  console.log('📋 Creating test spec for implementation...');

  const specDir = path.join(ROOT, '.kiro', 'specs', 'test-autonomous-feature');
  const specContent = `# Test Autonomous Feature

## Requirements
This is a test feature to verify the autonomous system works.

## Tasks
1. Create a utility function in src/lib/test-utils.ts
2. The function should be called \`autonomousTest\`
3. It should return a string "Autonomous system works!"
4. Write a test for this function

## Design
- Use TypeScript
- Follow existing code patterns
- Add proper JSDoc comments
`;

  try {
    fs.mkdirSync(specDir, { recursive: true });
    fs.writeFileSync(path.join(specDir, 'requirements.md'), specContent);
    console.log('✅ Created test spec:', specDir);
    return true;
  } catch (error) {
    console.error('❌ Failed to create test spec:', error.message);
    return false;
  }
}

async function cleanupTestFiles() {
  console.log('🧹 Cleaning up test files...');

  const testFile = path.join(ROOT, 'src', 'test-file.ts');
  const specDir = path.join(ROOT, '.kiro', 'specs', 'test-autonomous-feature');

  try {
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
      console.log('✅ Removed test file');
    }

    if (fs.existsSync(specDir)) {
      fs.rmSync(specDir, { recursive: true, force: true });
      console.log('✅ Removed test spec');
    }
  } catch (error) {
    console.warn('⚠️ Error cleaning up:', error.message);
  }
}

async function main() {
  console.log('🧪 Testing Autonomous Coder System');
  console.log('='.repeat(50));

  // Clean up any existing test files first
  await cleanupTestFiles();

  // Create test scenarios
  const issueCreated = await createTestIssue();
  const specCreated = await createTestSpec();

  if (!issueCreated && !specCreated) {
    console.error('❌ Failed to create test scenarios');
    process.exit(1);
  }

  console.log('\n🚀 Starting autonomous orchestrator...');
  console.log('💡 The system should detect the test issues and launch agents to fix them');
  console.log('💡 Watch for agent activity in the output below');
  console.log('💡 Press Ctrl+C to stop the test\n');

  // Load and start the autonomous orchestrator
  const AutonomousOrchestrator = require('./autonomous-orchestrator');
  const orchestrator = new AutonomousOrchestrator({
    validationInterval: 10000, // Check every 10 seconds for faster testing
    maxConcurrent: 2,
    agentTimeout: 120000 // 2 minutes for testing
  });

  // Set up cleanup on exit
  process.on('SIGINT', async () => {
    console.log('\n🧹 Cleaning up test files...');
    await cleanupTestFiles();
    console.log('✅ Test cleanup complete');
    process.exit(0);
  });

  try {
    await orchestrator.start();
  } catch (error) {
    console.error('❌ Failed to start test:', error.message);
    await cleanupTestFiles();
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});