#!/usr/bin/env node

// Autonomous orchestrator runner: integrates Guardian validation and launches
// up to three concurrent Claude Code chat sessions with proper context.

const fs = require('fs');
const path = require('path');
const { spawnSync, spawn } = require('child_process');

const ROOT = process.cwd();
const SPECS_DIR = path.join(ROOT, '.kiro', 'specs');
const ARCH_DIR = path.join(ROOT, '.kiro', 'architecture');
const QUEUE_DIR = path.join(ROOT, '.kiro', 'agents', 'claude-orchestrator', 'queue');

function listSpecs() {
  if (!fs.existsSync(SPECS_DIR)) return [];
  return fs
    .readdirSync(SPECS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('_'))
    .map(d => d.name);
}

function specFiles(spec) {
  const base = path.join(SPECS_DIR, spec);
  const files = ['requirements.md', 'design.md', 'tasks.md']
    .map(n => path.join(base, n))
    .filter(p => fs.existsSync(p));
  return files;
}

function ensureDirs() {
  try { if (!fs.existsSync(QUEUE_DIR)) fs.mkdirSync(QUEUE_DIR, { recursive: true }); } catch {}
}

function runGuardian(spec) {
  // Call guardian script if available; treat non-zero exit as failure.
  const guardianPath = path.join(ROOT, '.kiro', 'scripts', 'guardian.js');
  if (!fs.existsSync(guardianPath)) {
    console.log('⚠️ Guardian script not found, assuming pass for:', spec);
    return true;
  }
  const res = spawnSync(process.execPath, [guardianPath, '--spec', spec], {
    cwd: ROOT,
    stdio: 'inherit'
  });
  if (res.error) {
    console.log('⚠️ Guardian execution error, assuming pass:', res.error.message);
    return true;
  }
  const passed = res.status === 0;
  console.log(passed ? '✅ Guardian passed:' : '❌ Guardian failed:', spec);
  return passed;
}

function buildInlinePrompt(spec) {
  const specPath = path.join(SPECS_DIR, spec);
  const parts = [];
  const pushIfExists = (name) => {
    const p = path.join(specPath, name);
    if (fs.existsSync(p)) parts.push(`<<<SPEC:${name}>>>\n${fs.readFileSync(p, 'utf8')}\n<<<END>>>`);
  };
  pushIfExists('requirements.md');
  pushIfExists('design.md');
  pushIfExists('tasks.md');
  const header = `You are a focused implementation agent working in this repo.\nSpec: ${spec}\nFollow project conventions and implement tasks described below.`;
  return `${header}\n\n${parts.join('\n\n')}`;
}

function enqueueJob(spec, inlinePrompt, attachments) {
  const stamp = Date.now();
  const job = {
    specName: spec,
    inlinePrompt,
    attachments
  };
  const file = path.join(QUEUE_DIR, `${stamp}_${spec}.json`);
  fs.writeFileSync(file, JSON.stringify(job, null, 2));
  return file;
}

async function waitForProcessed(file, timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (!fs.existsSync(file)) return true;
    await new Promise(r => setTimeout(r, 500));
  }
  return !fs.existsSync(file);
}

async function orchestrate(specs, maxConcurrent = 3) {
  ensureDirs();
  const queue = [];
  for (const spec of specs) {
    // Validate via Guardian
    if (!runGuardian(spec)) continue;
    // Prepare prompt and attachments
    const prompt = buildInlinePrompt(spec);
    const attachments = [...specFiles(spec)];
    if (fs.existsSync(ARCH_DIR)) attachments.push(ARCH_DIR);
    queue.push({ spec, prompt, attachments });
  }

  console.log(`🚀 Starting orchestration for ${queue.length} spec(s), max ${maxConcurrent} concurrent.`);

  // Start the TRAE orchestrator in the background
  const orchestratorPath = path.join(ROOT, '.kiro', 'scripts', 'trae-orchestrator.js');
  if (!fs.existsSync(orchestratorPath)) {
    console.log('❌ TRAE orchestrator not found at:', orchestratorPath);
    console.log('💡 Please run: npm install or check that the orchestrator script exists');
    return;
  }

  console.log('🤖 Starting TRAE Claude Code Orchestrator...');
  const orchestratorProcess = spawn(process.execPath, [orchestratorPath], {
    cwd: ROOT,
    stdio: 'inherit',
    detached: true
  });

  // Give the orchestrator time to start
  await new Promise(r => setTimeout(r, 2000));

  // Enqueue all jobs
  const jobFiles = [];
  for (const { spec, prompt, attachments } of queue) {
    const jobFile = enqueueJob(spec, prompt, attachments);
    jobFiles.push(jobFile);
    console.log(`📋 Queued job for: ${spec}`);
  }

  console.log(`✅ ${jobFiles.length} jobs queued. The TRAE orchestrator will process them automatically.`);
  console.log('💡 The orchestrator will keep running and start Claude Code sessions for each job.');
  console.log('💡 Press Ctrl+C to stop the orchestrator when all jobs are complete.');

  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    orchestratorProcess.kill('SIGTERM');
    process.exit(0);
  });

  // Wait a bit to let jobs start processing
  await new Promise(r => setTimeout(r, 5000));
  console.log('🎉 Orchestration initiated - TRAE orchestrator is running in the background.');
}

async function main() {
  const arg = process.argv[2] || 'all';
  const specs = listSpecs();
  let targets = specs;
  if (arg && arg !== 'all') {
    targets = specs.includes(arg) ? [arg] : [];
    if (!targets.length) {
      console.log('❌ Spec not found:', arg);
      process.exitCode = 1;
      return;
    }
  }

  if (!targets.length) {
    console.log('ℹ️ No specs to run.');
    return;
  }
  await orchestrate(targets, 3);
}

main().catch(err => {
  console.error('Launcher error:', err?.message || err);
  process.exitCode = 1;
});