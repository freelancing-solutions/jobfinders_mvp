#!/usr/bin/env node

/**
 * Test script for TRAE Claude Code Orchestrator
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const QUEUE_DIR = path.join(ROOT, '.kiro', 'agents', 'claude-orchestrator', 'queue');

function ensureDirs() {
  try {
    if (!fs.existsSync(QUEUE_DIR)) {
      fs.mkdirSync(QUEUE_DIR, { recursive: true });
    }
    return true;
  } catch (error) {
    console.error('❌ Failed to create queue directory:', error.message);
    return false;
  }
}

function createTestJob() {
  const testJob = {
    specName: 'test-job',
    inlinePrompt: `You are a test implementation agent.

YOUR TASK:
1. Create a simple test file at src/test-implementation.txt
2. Add the text "Test implementation successful" to the file
3. Create a brief summary of what you did

This is a test to verify the orchestrator can communicate with Claude Code properly.`,
    attachments: []
  };

  const timestamp = Date.now();
  const jobFile = path.join(QUEUE_DIR, `${timestamp}_test-job.json`);

  try {
    fs.writeFileSync(jobFile, JSON.stringify(testJob, null, 2));
    console.log(`✅ Test job created: ${jobFile}`);
    return jobFile;
  } catch (error) {
    console.error('❌ Failed to create test job:', error.message);
    return null;
  }
}

async function main() {
  console.log('🧪 Testing TRAE Claude Code Orchestrator');
  console.log('='.repeat(50));

  // Ensure queue directory exists
  if (!ensureDirs()) {
    process.exit(1);
  }

  // Create a test job
  const testJobFile = createTestJob();
  if (!testJobFile) {
    process.exit(1);
  }

  console.log('\n🚀 Starting TRAE orchestrator...');

  // Start the orchestrator
  const TraeOrchestrator = require('./trae-orchestrator');
  const orchestrator = new TraeOrchestrator();

  // Start the orchestrator
  await orchestrator.start();

  console.log('\n💡 The orchestrator will now process the test job.');
  console.log('💡 It should start Claude Code and execute the test task.');
  console.log('💡 Press Ctrl+C to stop the test when complete.');

  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping test...');
    orchestrator.shutdown();
  });
}

main().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});