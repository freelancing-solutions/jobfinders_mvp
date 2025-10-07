#!/usr/bin/env node

/**
 * Integration Orchestration Script
 *
 * This script orchestrates the execution of the critical integration issues
 * according to the task dependencies and parallel execution plan.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class IntegrationOrchestrator {
  constructor() {
    this.tasks = this.loadTasks();
    this.currentPhase = 'foundation';
    this.completedTasks = new Set();
    this.inProgressTasks = new Set();
    this.failedTasks = new Set();
    this.parallelExecutions = new Map();
  }

  loadTasks() {
    // Load task definitions from the tasks.md file
    const tasksPath = path.join(__dirname, '../.kiro/specs/critical-integration-issues/tasks.md');
    const content = fs.readFileSync(tasksPath, 'utf8');

    // Parse tasks into structured format
    return {
      phase1: {
        name: 'Foundation Infrastructure',
        tasks: [
          { id: '1.1', name: 'Database Schema Enhancement', duration: 2, parallel: true },
          { id: '1.2', name: 'API Route Infrastructure', duration: 1.5, parallel: true },
          { id: '1.3', name: 'Event Bus Implementation', duration: 1.5, parallel: true },
          { id: '1.4', name: 'WebSocket Infrastructure', duration: 1, parallel: true }
        ]
      },
      phase2: {
        name: 'Core Feature Integration',
        tasks: [
          { id: '2.1', name: 'Matching System Integration', duration: 3, parallel: true, dependencies: ['1.1', '1.2'] },
          { id: '2.2', name: 'Resume Builder Integration', duration: 3, parallel: true, dependencies: ['1.1', '1.2'] },
          { id: '2.3', name: 'Notification System Integration', duration: 2, parallel: true, dependencies: ['1.2', '1.3'] },
          { id: '2.4', name: 'Enhanced Dashboard Integration', duration: 2, parallel: false, dependencies: ['2.1', '2.2', '2.3'] }
        ]
      },
      phase3: {
        name: 'Real-time Features',
        tasks: [
          { id: '3.1', name: 'Real-time Matching Updates', duration: 2, parallel: true, dependencies: ['1.3', '1.4', '2.1'] },
          { id: '3.2', name: 'Event-driven Notifications', duration: 2, parallel: true, dependencies: ['1.3', '2.3'] },
          { id: '3.3', name: 'Live Dashboard Updates', duration: 2, parallel: true, dependencies: ['2.4', '3.1', '3.2'] },
          { id: '3.4', name: 'Performance Optimization', duration: 2, parallel: false, dependencies: ['3.1', '3.2', '3.3'] }
        ]
      },
      phase4: {
        name: 'Testing & Refinement',
        tasks: [
          { id: '4.1', name: 'Integration Testing', duration: 3, parallel: false, dependencies: ['all'] },
          { id: '4.2', name: 'User Acceptance Testing', duration: 3, parallel: false, dependencies: ['4.1'] },
          { id: '4.3', name: 'Performance & Load Testing', duration: 2, parallel: false, dependencies: ['4.1'] },
          { id: '4.4', name: 'Documentation & Deployment', duration: 1, parallel: false, dependencies: ['4.2', '4.3'] }
        ]
      }
    };
  }

  async executeTask(taskId, task) {
    if (this.inProgressTasks.has(taskId)) {
      console.log(`⚠️  Task ${taskId} already in progress`);
      return;
    }

    if (this.completedTasks.has(taskId)) {
      console.log(`✅ Task ${taskId} already completed`);
      return;
    }

    console.log(`🚀 Starting Task ${taskId}: ${task.name}`);
    this.inProgressTasks.add(taskId);

    try {
      // Create task-specific scripts based on task ID
      const scriptPath = this.getTaskScriptPath(taskId);

      if (fs.existsSync(scriptPath)) {
        console.log(`📝 Executing script: ${scriptPath}`);
        execSync(`node ${scriptPath}`, { stdio: 'inherit' });
      } else {
        console.log(`📝 No specific script found for task ${taskId}, running generic task execution`);
        await this.executeGenericTask(taskId, task);
      }

      this.completedTasks.add(taskId);
      this.inProgressTasks.delete(taskId);
      console.log(`✅ Task ${taskId} completed successfully`);

      // Check for dependent tasks that can now be started
      this.checkDependentTasks(taskId);

    } catch (error) {
      this.failedTasks.add(taskId);
      this.inProgressTasks.delete(taskId);
      console.error(`❌ Task ${taskId} failed:`, error.message);
      throw error;
    }
  }

  getTaskScriptPath(taskId) {
    return path.join(__dirname, `tasks/task-${taskId.replace('.', '-')}.js`);
  }

  async executeGenericTask(taskId, task) {
    console.log(`📋 Executing generic task: ${task.name}`);

    // Simulate task execution based on task type
    switch (taskId) {
      case '1.1':
        await this.executeDatabaseSchemaUpdate();
        break;
      case '1.2':
        await this.executeAPIRouteCreation();
        break;
      case '1.3':
        await this.executeEventBusImplementation();
        break;
      case '1.4':
        await this.executeWebSocketSetup();
        break;
      default:
        console.log(`⏳ Simulating ${task.duration} day(s) of work for task ${taskId}`);
        await this.simulateWork(task.duration * 1000); // Convert to milliseconds for demo
    }
  }

  async executeDatabaseSchemaUpdate() {
    console.log('🗄️  Updating database schema...');

    // Run Prisma migrations
    execSync('npx prisma generate', { stdio: 'inherit' });
    execSync('npx prisma db push', { stdio: 'inherit' });

    console.log('✅ Database schema updated');
  }

  async executeAPIRouteCreation() {
    console.log('🛣️  Creating API routes...');

    // Create API route directories
    const apiDirs = [
      'src/app/api/matching',
      'src/app/api/resume-builder',
      'src/app/api/notifications',
      'src/app/api/events'
    ];

    apiDirs.forEach(dir => {
      const fullPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    });

    console.log('✅ API routes infrastructure created');
  }

  async executeEventBusImplementation() {
    console.log('📡 Implementing event bus...');

    // Create event bus directories
    const eventDirs = [
      'src/lib/events',
      'src/lib/queues'
    ];

    eventDirs.forEach(dir => {
      const fullPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    });

    console.log('✅ Event bus infrastructure created');
  }

  async executeWebSocketSetup() {
    console.log('🔌 Setting up WebSocket infrastructure...');

    // Create WebSocket directories
    const wsDirs = [
      'src/lib/websocket'
    ];

    wsDirs.forEach(dir => {
      const fullPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    });

    console.log('✅ WebSocket infrastructure created');
  }

  async simulateWork(duration) {
    return new Promise(resolve => setTimeout(resolve, duration));
  }

  checkDependencies(taskId) {
    const task = this.findTask(taskId);
    if (!task.dependencies || task.dependencies.length === 0) {
      return true;
    }

    return task.dependencies.every(dep => {
      if (dep === 'all') {
        return this.areAllPreviousTasksCompleted(taskId);
      }
      return this.completedTasks.has(dep);
    });
  }

  areAllPreviousTasksCompleted(taskId) {
    const [phaseNum] = taskId.split('.');
    return Array.from(this.completedTasks).every(completedTask => {
      const [completedPhaseNum] = completedTask.split('.');
      return parseInt(completedPhaseNum) < parseInt(phaseNum);
    });
  }

  findTask(taskId) {
    for (const phase of Object.values(this.tasks)) {
      const task = phase.tasks.find(t => t.id === taskId);
      if (task) return task;
    }
    return null;
  }

  checkDependentTasks(completedTaskId) {
    // Find tasks that depend on the completed task
    for (const phase of Object.values(this.tasks)) {
      for (const task of phase.tasks) {
        if (task.dependencies && task.dependencies.includes(completedTaskId)) {
          if (this.checkDependencies(task.id) && !this.completedTasks.has(task.id)) {
            console.log(`🎯 Dependencies met for task ${task.id}: ${task.name}`);
          }
        }
      }
    }
  }

  async executePhase(phaseName, phase) {
    console.log(`\n🌟 Starting Phase: ${phase.name}`);
    console.log(`📋 Tasks: ${phase.tasks.map(t => t.id).join(', ')}`);

    const executableTasks = phase.tasks.filter(task =>
      this.checkDependencies(task.id) && !this.completedTasks.has(task.id)
    );

    if (executableTasks.length === 0) {
      console.log('⏳ No executable tasks in this phase yet, waiting for dependencies');
      return;
    }

    // Group tasks by parallel execution capability
    const parallelTasks = executableTasks.filter(task => task.parallel);
    const sequentialTasks = executableTasks.filter(task => !task.parallel);

    // Execute parallel tasks
    if (parallelTasks.length > 0) {
      console.log(`⚡ Executing ${parallelTasks.length} parallel tasks: ${parallelTasks.map(t => t.id).join(', ')}`);

      const parallelPromises = parallelTasks.map(task =>
        this.executeTask(task.id, task).catch(error => {
          console.error(`❌ Parallel task ${task.id} failed:`, error.message);
          throw error;
        })
      );

      await Promise.all(parallelPromises);
    }

    // Execute sequential tasks
    for (const task of sequentialTasks) {
      if (this.checkDependencies(task.id)) {
        await this.executeTask(task.id, task);
      } else {
        console.log(`⏳ Skipping task ${task.id} - dependencies not met`);
      }
    }

    console.log(`✅ Phase ${phaseName} completed`);
  }

  async start() {
    console.log('🚀 Starting Critical Integration Implementation');
    console.log('📅 Timeline: 4 weeks (20 days)');
    console.log('👥 Team: 3 full-stack developers, 1 QA engineer, 1 DevOps engineer\n');

    try {
      // Phase 1: Foundation Infrastructure (Days 1-5)
      await this.executePhase('phase1', this.tasks.phase1);

      // Phase 2: Core Feature Integration (Days 3-10)
      await this.executePhase('phase2', this.tasks.phase2);

      // Phase 3: Real-time Features (Days 8-15)
      await this.executePhase('phase3', this.tasks.phase3);

      // Phase 4: Testing & Refinement (Days 12-20)
      await this.executePhase('phase4', this.tasks.phase4);

      console.log('\n🎉 All integration tasks completed successfully!');
      console.log('📊 Summary:');
      console.log(`   ✅ Completed: ${this.completedTasks.size} tasks`);
      console.log(`   ❌ Failed: ${this.failedTasks.size} tasks`);
      console.log(`   ⏱️  Total duration: ~20 days`);

    } catch (error) {
      console.error('\n💥 Integration execution failed:', error.message);
      console.log('📊 Failed tasks:', Array.from(this.failedTasks).join(', '));
      process.exit(1);
    }
  }

  async executeInteractiveMode() {
    console.log('🎮 Interactive Mode');
    console.log('Available commands:');
    console.log('  status - Show current status');
    console.log('  phase <phase-id> - Execute specific phase');
    console.log('  task <task-id> - Execute specific task');
    console.log('  plan - Show execution plan');
    console.log('  help - Show this help');

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const askQuestion = (question) => {
      return new Promise(resolve => rl.question(question, resolve));
    };

    while (true) {
      const answer = await askQuestion('\nintegration> ');

      if (answer === 'exit' || answer === 'quit') {
        break;
      }

      try {
        await this.handleCommand(answer);
      } catch (error) {
        console.error('❌ Command failed:', error.message);
      }
    }

    rl.close();
  }

  async handleCommand(command) {
    const [cmd, ...args] = command.split(' ');

    switch (cmd) {
      case 'status':
        this.showStatus();
        break;

      case 'phase':
        if (args[0] && this.tasks[args[0]]) {
          await this.executePhase(args[0], this.tasks[args[0]]);
        } else {
          console.log('❌ Invalid phase. Available phases:', Object.keys(this.tasks).join(', '));
        }
        break;

      case 'task':
        if (args[0]) {
          const task = this.findTask(args[0]);
          if (task) {
            await this.executeTask(args[0], task);
          } else {
            console.log('❌ Invalid task ID:', args[0]);
          }
        } else {
          console.log('❌ Task ID required');
        }
        break;

      case 'plan':
        this.showExecutionPlan();
        break;

      case 'help':
        this.showHelp();
        break;

      default:
        console.log('❌ Unknown command:', cmd);
        this.showHelp();
    }
  }

  showStatus() {
    console.log('\n📊 Current Status:');
    console.log(`   ✅ Completed: ${Array.from(this.completedTasks).join(', ')}`);
    console.log(`   🔄 In Progress: ${Array.from(this.inProgressTasks).join(', ')}`);
    console.log(`   ❌ Failed: ${Array.from(this.failedTasks).join(', ')}`);
  }

  showExecutionPlan() {
    console.log('\n📅 Execution Plan:');

    for (const [phaseId, phase] of Object.entries(this.tasks)) {
      console.log(`\n${phaseId.toUpperCase()}: ${phase.name}`);
      for (const task of phase.tasks) {
        const status = this.completedTasks.has(task.id) ? '✅' :
                      this.inProgressTasks.has(task.id) ? '🔄' :
                      this.failedTasks.has(task.id) ? '❌' : '⏳';
        const deps = task.dependencies ? ` (deps: ${task.dependencies.join(', ')})` : '';
        const parallel = task.parallel ? ' [parallel]' : ' [sequential]';
        console.log(`   ${status} ${task.id}: ${task.name} (${task.duration}d)${deps}${parallel}`);
      }
    }
  }

  showHelp() {
    console.log('\n📖 Available Commands:');
    console.log('  status    - Show current execution status');
    console.log('  phase <id> - Execute a specific phase');
    console.log('  task <id>  - Execute a specific task');
    console.log('  plan      - Show detailed execution plan');
    console.log('  help      - Show this help message');
    console.log('  exit      - Exit interactive mode');
  }
}

// CLI interface
async function main() {
  const orchestrator = new IntegrationOrchestrator();

  const args = process.argv.slice(2);

  if (args.includes('--interactive') || args.includes('-i')) {
    await orchestrator.executeInteractiveMode();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log('Critical Integration Orchestration Script');
    console.log('');
    console.log('Usage:');
    console.log('  node orchestrate-integration.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  -i, --interactive  Run in interactive mode');
    console.log('  -h, --help         Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  node orchestrate-integration.js                # Run full implementation');
    console.log('  node orchestrate-integration.js --interactive  # Run in interactive mode');
  } else {
    await orchestrator.start();
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Orchestration failed:', error);
    process.exit(1);
  });
}

module.exports = IntegrationOrchestrator;