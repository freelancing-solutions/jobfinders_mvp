#!/usr/bin/env node

/**
 * Start the Autonomous Coder System
 * Replaces the old queue-based system with true autonomous agents
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

async function main() {
  console.log('🚀 Starting Autonomous Coder System');
  console.log('='.repeat(50));

  // Check if the autonomous orchestrator exists
  const orchestratorPath = path.join(ROOT, '.kiro', 'scripts', 'autonomous-orchestrator.js');
  if (!fs.existsSync(orchestratorPath)) {
    console.error('❌ Autonomous orchestrator not found at:', orchestratorPath);
    console.error('💡 Please ensure the file exists and try again');
    process.exit(1);
  }

  // Load and start the autonomous orchestrator
  console.log('🤖 Loading autonomous orchestrator...');
  const AutonomousOrchestrator = require('./autonomous-orchestrator');

  const orchestrator = new AutonomousOrchestrator({
    validationInterval: 30000, // Check every 30 seconds
    maxConcurrent: 3, // Run up to 3 agents simultaneously
    agentTimeout: 300000 // 5 minutes per agent
  });

  console.log('✅ Starting autonomous system...');
  console.log('💡 The system will:');
  console.log('   - Continuously validate the codebase');
  console.log('   - Automatically launch coder agents when issues are detected');
  console.log('   - Implement pending specs automatically');
  console.log('   - Run multiple agents concurrently');
  console.log('   - Stay running until stopped (Ctrl+C)');
  console.log('');

  try {
    await orchestrator.start();
  } catch (error) {
    console.error('❌ Failed to start autonomous system:', error.message);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ System startup failed:', error.message);
  process.exit(1);
});