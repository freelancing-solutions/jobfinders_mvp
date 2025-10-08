#!/usr/bin/env node

/**
 * Simplified Guardian for initial installation
 * No external dependencies required
 */

const fs = require('fs');
const path = require('path');

class SimpleGuardian {
  constructor() {
    this.basePath = path.resolve(__dirname, '..');
    this.specsPath = path.join(this.basePath, 'specs');
    this.conflicts = [];
    this.warnings = [];
  }

  async validate() {
    console.log('🔍 Simple Guardian Validation...\n');

    try {
      await this.validateSpecs();
      await this.checkBasicStructure();

      this.outputResults();
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    }
  }

  async validateSpecs() {
    console.log('📋 Validating specifications...');

    if (!fs.existsSync(this.specsPath)) {
      this.addConflict('MISSING_SPECS_DIR', ['.kiro/'],
        'specs directory not found', 'Cannot validate specifications');
      return;
    }

    const specFolders = fs.readdirSync(this.specsPath)
      .filter(file => {
        const fullPath = path.join(this.specsPath, file);
        return fs.statSync(fullPath).isDirectory();
      })
      .filter(folder => !folder.startsWith('_') && folder !== 'TEMPLATE');

    console.log(`✅ Found ${specFolders.length} active spec folders`);

    for (const folder of specFolders) {
      const specPath = path.join(this.specsPath, folder);
      const hasRequirements = fs.existsSync(path.join(specPath, 'requirements.md'));

      if (!hasRequirements) {
        this.addConflict('MISSING_REQUIREMENTS', [`specs/${folder}`],
          `Missing requirements.md file`, 'Spec is incomplete');
      }
    }
  }

  async checkBasicStructure() {
    console.log('🏗️ Checking basic structure...');

    const requiredFiles = [
      'README.md',
      'scripts/guardian.js',
      'scripts/orchestrate.js',
      'prompts/orchestrator.md',
      'prompts/implementation-agent.md'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(this.basePath, file);
      if (!fs.existsSync(filePath)) {
        this.addWarning(`Missing ${file}`);
      }
    }
  }

  addConflict(category, files, issue, impact) {
    this.conflicts.push({ category, files, issue, impact });
  }

  addWarning(message) {
    this.warnings.push(message);
  }

  outputResults() {
    console.log('\n' + '='.repeat(50));
    console.log('🛡️ GUARDIAN VALIDATION RESULTS');
    console.log('='.repeat(50));

    if (this.conflicts.length === 0 && this.warnings.length === 0) {
      console.log('✅ Context validated - No conflicts detected');
      console.log('└─ System is ready for orchestration');
      process.exit(0);
    }

    if (this.conflicts.length > 0) {
      console.log(`\n⚠️ ${this.conflicts.length} CONFLICT(S) DETECTED:\n`);

      for (const conflict of this.conflicts) {
        console.log(`⚠️ CONFLICT: ${conflict.category}`);
        console.log(`├─ Location: ${conflict.files.join(', ')}`);
        console.log(`├─ Issue: ${conflict.issue}`);
        console.log(`└─ Impact: ${conflict.impact}\n`);
      }
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚡ ${this.warnings.length} WARNING(S):\n`);

      for (const warning of this.warnings) {
        console.log(`⚡ ${warning}`);
      }
      console.log();
    }

    console.log('='.repeat(50));

    if (this.conflicts.length > 0) {
      console.log('❌ Fix conflicts before proceeding');
      process.exit(1);
    } else {
      console.log('✅ System can proceed with warnings');
    }
  }
}

if (require.main === module) {
  const guardian = new SimpleGuardian();
  guardian.validate().catch(error => {
    console.error('Guardian failed:', error);
    process.exit(1);
  });
}

module.exports = SimpleGuardian;