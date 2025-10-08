#!/usr/bin/env node

/**
 * Test the VSCode extension setup and functionality
 */

const fs = require('fs');
const path = require('path');

async function testExtensionSetup() {
  console.log('🧪 Testing VSCode Extension Setup');
  console.log('='.repeat(40));

  const rootPath = process.cwd();
  const extensionPath = path.join(rootPath, '.kiro', 'vscode-extension');

  // Test 1: Check extension files exist
  console.log('\n📁 Test 1: Extension Files');
  const requiredFiles = ['package.json', 'extension.js', 'README.md'];
  let allFilesExist = true;

  for (const file of requiredFiles) {
    const filePath = path.join(extensionPath, file);
    const exists = fs.existsSync(filePath);
    console.log(`   ${exists ? '✅' : '❌'} ${file}`);
    if (!exists) allFilesExist = false;
  }

  if (!allFilesExist) {
    console.log('❌ Some extension files are missing');
    return false;
  }

  // Test 2: Check package.json structure
  console.log('\n📋 Test 2: Package.json Structure');
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(extensionPath, 'package.json'), 'utf8'));

    const requiredFields = ['name', 'displayName', 'description', 'version', 'engines', 'main', 'contributes'];
    let allFieldsExist = true;

    for (const field of requiredFields) {
      const exists = packageJson[field] !== undefined;
      console.log(`   ${exists ? '✅' : '❌'} ${field}`);
      if (!exists) allFieldsExist = false;
    }

    if (!allFieldsExist) {
      console.log('❌ Some required fields are missing in package.json');
      return false;
    }

    console.log(`   📦 Extension Name: ${packageJson.name}`);
    console.log(`   📦 Version: ${packageJson.version}`);
    console.log(`   📦 Main File: ${packageJson.main}`);

  } catch (error) {
    console.log('❌ Failed to parse package.json:', error.message);
    return false;
  }

  // Test 3: Check extension.js structure
  console.log('\n🔧 Test 3: Extension.js Structure');
  try {
    const extensionContent = fs.readFileSync(path.join(extensionPath, 'extension.js'), 'utf8');

    const requiredExports = ['activate', 'deactivate'];
    let allExportsExist = true;

    for (const exportName of requiredExports) {
      const exists = extensionContent.includes(`module.exports`) && extensionContent.includes(exportName);
      console.log(`   ${exists ? '✅' : '❌'} Export ${exportName}`);
      if (!exists) allExportsExist = false;
    }

    if (!allExportsExist) {
      console.log('❌ Some required exports are missing in extension.js');
      return false;
    }

  } catch (error) {
    console.log('❌ Failed to read extension.js:', error.message);
    return false;
  }

  // Test 4: Check commands are defined
  console.log('\n⚡ Test 4: Commands Definition');
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(extensionPath, 'package.json'), 'utf8'));
    const commands = packageJson.contributes?.commands || [];

    const expectedCommands = [
      'autonomous-coder.processJob',
      'autonomous-coder.startOrchestrator',
      'autonomous-coder.showJobs'
    ];

    for (const expectedCommand of expectedCommands) {
      const exists = commands.some(cmd => cmd.command === expectedCommand);
      console.log(`   ${exists ? '✅' : '❌'} ${expectedCommand}`);
    }

    console.log(`   📋 Total Commands: ${commands.length}`);

  } catch (error) {
    console.log('❌ Failed to check commands:', error.message);
    return false;
  }

  // Test 5: Check orchestrator compatibility
  console.log('\n🤖 Test 5: Orchestrator Compatibility');
  const orchestratorPath = path.join(rootPath, '.kiro', 'scripts', 'vscode-orchestrator.js');
  const orchestratorExists = fs.existsSync(orchestratorPath);
  console.log(`   ${orchestratorExists ? '✅' : '❌'} VSCode Orchestrator exists`);

  if (!orchestratorExists) {
    console.log('❌ VSCode orchestrator not found');
    return false;
  }

  // Test 6: Check job directory can be created
  console.log('\n📁 Test 6: Job Directory Setup');
  const jobsDir = path.join(rootPath, '.kiro', 'vscode-jobs');
  try {
    if (!fs.existsSync(jobsDir)) {
      fs.mkdirSync(jobsDir, { recursive: true });
    }
    console.log('   ✅ Job directory can be created');
  } catch (error) {
    console.log('   ❌ Failed to create job directory:', error.message);
    return false;
  }

  console.log('\n🎉 All tests passed! Extension setup is correct.');
  console.log('\n📋 Next Steps:');
  console.log('1. Run: node .kiro/scripts/package-extension.js');
  console.log('2. Install the generated VSIX file in VSCode');
  console.log('3. Test the extension commands in VSCode');

  return true;
}

// Create a sample job file for testing
function createSampleJob() {
  console.log('\n🧪 Creating Sample Job for Testing');

  const rootPath = process.cwd();
  const jobsDir = path.join(rootPath, '.kiro', 'vscode-jobs');

  try {
    if (!fs.existsSync(jobsDir)) {
      fs.mkdirSync(jobsDir, { recursive: true });
    }

    const sampleJob = {
      agentId: `test-agent-${Date.now()}`,
      task: {
        type: 'fix_issue',
        issueType: 'test_failure',
        issues: [
          {
            type: 'test_failure',
            description: 'Sample test failure for extension testing',
            severity: 'medium',
            source: 'test'
          }
        ],
        priority: 'medium'
      },
      prompt: `You are an autonomous debugging and fixing agent.

ISSUES TO FIX:
- Sample test failure for extension testing (medium severity)

YOUR TASKS:
1. Analyze the test failure
2. Fix the issue if possible
3. Run tests to verify the fix
4. Create a summary of changes

WORK AUTONOMously without asking for permission.
After completing, mark this job as completed.`,
      timestamp: Date.now(),
      status: 'pending'
    };

    const jobFile = path.join(jobsDir, `${sampleJob.agentId}.json`);
    fs.writeFileSync(jobFile, JSON.stringify(sampleJob, null, 2));

    console.log(`✅ Sample job created: ${jobFile}`);
    console.log('💡 Use "Autonomous Coder: Process Job" command in VSCode to test');

    return jobFile;
  } catch (error) {
    console.error('❌ Failed to create sample job:', error.message);
    return null;
  }
}

async function main() {
  const setupOk = await testExtensionSetup();

  if (setupOk) {
    createSampleJob();
  } else {
    console.log('\n❌ Extension setup has issues. Please fix them before proceeding.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Test script failed:', error.message);
  process.exit(1);
});