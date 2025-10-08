#!/usr/bin/env node

/**
 * Implementation Orchestrator Script
 * Generates implementation plan and provides commands
 */

const fs = require('fs');
const path = require('path');

class Orchestrator {
  constructor() {
    this.basePath = path.resolve(__dirname, '..');
    this.specsPath = path.join(this.basePath, 'specs');
    this.architecturePath = path.join(this.basePath, 'architecture');
    this.codeReviewsPath = path.join(this.basePath, '_CodeReviews');
    this.srcPath = path.join(this.basePath, '..', 'src');
  }

  async run() {
    console.log('🎯 Implementation Orchestrator');
    console.log('='.repeat(50));
    console.log('');

    // Analyze specs and implementation status
    const analysis = this.analyzeSpecs();

    // Generate implementation plan
    this.generatePlan(analysis);
  }

  analyzeSpecs() {
    console.log('📋 Analyzing specifications...');

    const specFolders = this.getDirectories(this.specsPath)
      .filter(folder => !folder.startsWith('_') && !folder.startsWith('TEMPLATE'));

    const analysis = {
      total: specFolders.length,
      implemented: [],
      notImplemented: [],
      priority: []
    };

    // Check existing implementations
    const existingImplementations = this.getExistingImplementations();

    for (const folder of specFolders) {
      const specPath = path.join(this.specsPath, folder);
      const requirementsPath = path.join(specPath, 'requirements.md');

      if (!fs.existsSync(requirementsPath)) {
        console.log(`⚠️  Skipping ${folder} - no requirements.md`);
        continue;
      }

      // Check if implemented
      const isImplemented = existingImplementations.some(impl =>
        impl.includes(folder.toLowerCase()) ||
        folder.toLowerCase().includes(impl)
      );

      const specInfo = {
        folder,
        path: specPath,
        hasDesign: fs.existsSync(path.join(specPath, 'design.md')),
        hasTasks: fs.existsSync(path.join(specPath, 'tasks.md')),
        priority: this.determinePriority(folder),
        dependencies: this.findDependencies(folder)
      };

      if (isImplemented) {
        analysis.implemented.push(specInfo);
      } else {
        analysis.notImplemented.push(specInfo);
      }
    }

    // Sort by priority and dependencies
    analysis.notImplemented.sort((a, b) => {
      // First by dependencies (no dependencies first)
      if (a.dependencies.length === 0 && b.dependencies.length > 0) return -1;
      if (b.dependencies.length === 0 && a.dependencies.length > 0) return 1;

      // Then by priority
      const priorityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    console.log(`✅ Found ${analysis.total} specs`);
    console.log(`   - ${analysis.implemented.length} already implemented`);
    console.log(`   - ${analysis.notImplemented.length} need implementation`);
    console.log('');

    return analysis;
  }

  generatePlan(analysis) {
    console.log('📊 IMPLEMENTATION PLAN');
    console.log('='.repeat(50));
    console.log('');

    if (analysis.notImplemented.length === 0) {
      console.log('🎉 All specs are implemented!');
      return;
    }

    console.log('📋 Specs Needing Implementation:');
    analysis.notImplemented.forEach((spec, index) => {
      const depStr = spec.dependencies.length > 0 ?
        ` (Dependencies: ${spec.dependencies.join(', ')})` : '';
      console.log(`${index + 1}. ${spec.folder} (Priority: ${spec.priority})${depStr}`);
    });

    console.log('');
    console.log('='.repeat(50));
    console.log('STEP 1: Validate Specifications');
    console.log('='.repeat(50));
    console.log('');
    console.log('Run this command first:');
    console.log('');
    console.log('```bash');
    console.log('node .kiro/scripts/guardian.js');
    console.log('```');
    console.log('');
    console.log('⚠️  Only proceed if Guardian reports no conflicts.');
    console.log('');

    // Generate implementation commands
    console.log('='.repeat(50));
    console.log('STEP 2: Implement Features (Sequentially)');
    console.log('='.repeat(50));
    console.log('');

    for (let i = 0; i < analysis.notImplemented.length; i++) {
      const spec = analysis.notImplemented[i];
      const stepNum = i + 2;

      console.log(`STEP ${stepNum}: Implement ${spec.folder}`);
      console.log('-'.repeat(30));
      console.log('');

      const prompt = this.generateImplementationPrompt(spec);

      console.log('```bash');
      console.log(prompt);
      console.log('```');
      console.log('');

      if (i < analysis.notImplemented.length - 1) {
        console.log(`After implementation completes, run Guardian to validate:`);
        console.log('');
        console.log('```bash');
        console.log('node .kiro/scripts/guardian.js');
        console.log('```');
        console.log('');
        console.log('⚠️  Only proceed to next feature if Guardian passes.');
        console.log('');
      }
    }

    console.log('='.repeat(50));
    console.log('FINAL STEP: Verification');
    console.log('='.repeat(50));
    console.log('');
    console.log('Run final validation:');
    console.log('');
    console.log('```bash');
    console.log('npm test');
    console.log('node .kiro/scripts/guardian.js');
    console.log('```');
    console.log('');
    console.log('🎉 Implementation workflow complete!');
  }

  generateImplementationPrompt(spec) {
    const specFiles = [];

    // Add all spec files for this feature
    const specPath = path.join(this.specsPath, spec.folder);
    if (fs.existsSync(path.join(specPath, 'requirements.md'))) {
      specFiles.push(`.kiro/specs/${spec.folder}/requirements.md`);
    }
    if (fs.existsSync(path.join(specPath, 'design.md'))) {
      specFiles.push(`.kiro/specs/${spec.folder}/design.md`);
    }
    if (fs.existsSync(path.join(specPath, 'tasks.md'))) {
      specFiles.push(`.kiro/specs/${spec.folder}/tasks.md`);
    }

    return `claude-code --prompt "You are a Feature Implementation Agent.

SPEC TO IMPLEMENT: ${specFiles.join(', ')}

YOUR BOUNDARIES:
- READ ONLY: .kiro/specs/, .kiro/architecture/
- WRITE TO: src/, tests/, .kiro/_CodeReviews/
- NEVER modify: .kiro/prompts/, .kiro/config/, prisma/schema.prisma

YOUR TASKS:
1. Read the spec completely - it defines where files should go
2. Read related architecture docs for project conventions
3. Follow the file structure specified in the spec
4. Write tests according to spec guidelines
5. Create code review in .kiro/_CodeReviews/${spec.folder}-${this.getDate()}.md

CRITICAL: The spec dictates file locations and structure. DO NOT impose your own organization.
If the spec doesn't specify structure, follow existing project patterns found in src/.

IMPLEMENTATION RULES:
- Use existing utilities and helpers from src/lib/
- Match the code style of existing files
- Add JSDoc comments for all public functions
- Handle all edge cases from spec
- Write comprehensive error handling
- Use TypeScript strictly (avoid any types)
- Follow Next.js App Router patterns

After implementation, create a summary:
- Files created/modified (exact paths as determined by spec)
- Key decisions made
- Any deviations from spec (with justification)
- Tests written
" --files "${specFiles.join(',')},.kiro/architecture/**/*,src/**/*,tests/**/*"`;
  }

  getDirectories(dirPath) {
    if (!fs.existsSync(dirPath)) return [];

    return fs.readdirSync(dirPath)
      .filter(file => {
        const fullPath = path.join(dirPath, file);
        return fs.statSync(fullPath).isDirectory();
      });
  }

  getExistingImplementations() {
    const implementations = [];

    // Check code reviews
    if (fs.existsSync(this.codeReviewsPath)) {
      const reviews = fs.readdirSync(this.codeReviewsPath)
        .filter(file => file.endsWith('.md'));

      implementations.push(...reviews.map(review =>
        review.replace(/-\d{8}\.md$/, '').toLowerCase()
      ));
    }

    // Check src directory for feature implementations
    if (fs.existsSync(this.srcPath)) {
      this.scanSrcForFeatures(this.srcPath, implementations);
    }

    return [...new Set(implementations)];
  }

  scanSrcForFeatures(dirPath, implementations, depth = 0) {
    if (depth > 3) return; // Limit recursion depth

    try {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          implementations.push(item.toLowerCase());
          this.scanSrcForFeatures(fullPath, implementations, depth + 1);
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
  }

  determinePriority(folder) {
    const highPriority = [
      'critical-integration-issues',
      'applications-management',
      'saved-jobs',
      'dashboard-user-details-fix'
    ];

    const mediumPriority = [
      'resume-builder-ui',
      'design-system',
      'message-queue-system'
    ];

    if (highPriority.some(keyword => folder.includes(keyword))) {
      return 'High';
    } else if (mediumPriority.some(keyword => folder.includes(keyword))) {
      return 'Medium';
    } else {
      return 'Low';
    }
  }

  findDependencies(folder) {
    // Simple dependency detection based on folder names
    const dependencies = [];

    if (folder.includes('resume-builder') && !folder.includes('integration')) {
      dependencies.push('resume-builder-integration');
    }

    if (folder.includes('notification')) {
      dependencies.push('notification-system-unified');
    }

    if (folder.includes('ai-') || folder.includes('matching')) {
      dependencies.push('candidate-matching-system');
    }

    return dependencies;
  }

  getDate() {
    return new Date().toISOString().split('T')[0].replace(/-/g, '');
  }
}

// CLI interface
if (require.main === module) {
  const orchestrator = new Orchestrator();
  orchestrator.run().catch(error => {
    console.error('Orchestrator failed:', error.message);
    process.exit(1);
  });
}

module.exports = Orchestrator;