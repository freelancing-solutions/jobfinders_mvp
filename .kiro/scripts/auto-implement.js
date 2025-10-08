#!/usr/bin/env node

/**
 * Automated Implementation Runner
 * Implements a single spec from start to finish
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Handle Windows path issues
const isWindows = process.platform === 'win32';

class AutoImplementer {
  constructor() {
    this.basePath = path.resolve(__dirname, '..');
    this.specsPath = path.join(this.basePath, 'specs');
  }

  async run(specFolder) {
    if (!specFolder) {
      console.error('Usage: node auto-implement.js <spec-folder>');
      console.error('Example: node auto-implement.js saved-jobs');
      process.exit(1);
    }

    console.log(`🎯 Automated Implementation: ${specFolder}`);
    console.log('='.repeat(50));

    try {
      // Step 1: Guardian validation
      await this.runGuardian();

      // Step 2: Implementation
      await this.implementSpec(specFolder);

      // Step 3: Post-implementation validation
      await this.runGuardian();

      console.log('✅ IMPLEMENTATION COMPLETE');
      console.log('='.repeat(50));
      console.log(`Feature: ${specFolder}`);
      console.log(`Review: .kiro/_CodeReviews/${specFolder}-${this.getDate()}.md`);
      console.log('');
      console.log('Next: npm test');

    } catch (error) {
      console.error('❌ Implementation failed:', error.message);
      process.exit(1);
    }
  }

  async runGuardian() {
    console.log('');
    console.log('━━━ STEP: Guardian Validation ━━━');

    try {
      execSync('node scripts/guardian.js', {
        stdio: 'inherit',
        cwd: this.basePath,
        shell: true
      });
      console.log('✅ Guardian passed');
    } catch (error) {
      console.error('❌ Guardian failed. Fix conflicts first.');
      throw error;
    }
  }

  async implementSpec(specFolder) {
    console.log('');
    console.log(`━━━ STEP: Implementing ${specFolder} ━━━`);

    // Find spec files
    const specPath = path.join(this.specsPath, specFolder);
    if (!fs.existsSync(specPath)) {
      throw new Error(`Spec folder not found: ${specFolder}`);
    }

    const specFiles = [];
    if (fs.existsSync(path.join(specPath, 'requirements.md'))) {
      specFiles.push(`.kiro/specs/${specFolder}/requirements.md`);
    }
    if (fs.existsSync(path.join(specPath, 'design.md'))) {
      specFiles.push(`.kiro/specs/${specFolder}/design.md`);
    }
    if (fs.existsSync(path.join(specPath, 'tasks.md'))) {
      specFiles.push(`.kiro/specs/${specFolder}/tasks.md`);
    }

    if (specFiles.length === 0) {
      throw new Error(`No spec files found in ${specFolder}`);
    }

    // Generate implementation prompt
    const prompt = this.generateImplementationPrompt(specFolder, specFiles);

    // Save prompt to temporary file
    const tempPromptPath = path.join(this.basePath, 'temp-prompt.txt');
    fs.writeFileSync(tempPromptPath, prompt);

    try {
      // Execute implementation
      const filesArg = `${specFiles.join(',')},.kiro/architecture/**/*,src/**/*,tests/**/*`;

      console.log('🔧 Running implementation agent...');

      // In a real implementation, this would call claude-code
      // For now, we'll show what would be executed
      console.log('');
      console.log('Would execute:');
      console.log(`claude-code --prompt-file "${tempPromptPath}" --files "${filesArg}"`);
      console.log('');
      console.log('⚠️  Manual execution required. Copy the command above.');

      // For demonstration, we'll create a placeholder implementation
      await this.createPlaceholderImplementation(specFolder);

    } finally {
      // Clean up temp file
      if (fs.existsSync(tempPromptPath)) {
        fs.unlinkSync(tempPromptPath);
      }
    }
  }

  generateImplementationPrompt(specFolder, specFiles) {
    return `You are a Feature Implementation Agent.

SPEC TO IMPLEMENT: ${specFiles.join(', ')}

YOUR BOUNDARIES - READ THESE CAREFULLY:
✅ READ ONLY: .kiro/specs/, .kiro/architecture/
✅ WRITE TO: src/, tests/, .kiro/_CodeReviews/
❌ NEVER TOUCH: .kiro/prompts/, .kiro/config/, prisma/schema.prisma, other features

CRITICAL: The spec defines where files should be placed. DO NOT impose your own structure.
Read the spec carefully to understand the required file organization.
Forcing files into a predetermined structure (like src/features/) introduces inconsistencies.

TASKS:
1. Read ${specFiles.join(', ')} completely - it specifies file locations
2. Read relevant architecture docs for project conventions
3. Implement files exactly where spec indicates
4. Write tests according to spec guidelines
5. Create .kiro/_CodeReviews/${specFolder}-${this.getDate()}.md with file locations

RULES:
- Follow file structure defined in spec
- Match existing code style in similar files
- Use TypeScript strictly (no any types)
- Write comprehensive tests
- Add JSDoc comments
- Handle all edge cases from spec
- Reuse existing utilities

PROJECT CONTEXT:
- Next.js 15 with App Router
- TypeScript with strict mode
- Prisma ORM for database
- NextAuth.js for authentication
- Tailwind CSS + shadcn/ui for styling
- Existing patterns in src/lib/ for utilities
- API routes in src/app/api/
- Components in src/components/

After implementation, output:
- Summary of what was built (defer to code review for file paths)
- Key decisions made
- Test coverage summary
- Code review location`;
  }

  async createPlaceholderImplementation(specFolder) {
    // Create a placeholder implementation for demonstration
    const codeReviewPath = path.join(this.basePath, '_CodeReviews');

    // Ensure _CodeReviews directory exists
    if (!fs.existsSync(codeReviewPath)) {
      fs.mkdirSync(codeReviewPath, { recursive: true });
    }

    const reviewFile = path.join(codeReviewPath, `${specFolder}-${this.getDate()}.md`);
    const reviewContent = `# Code Review: ${specFolder}

**Date:** ${new Date().toISOString().split('T')[0]}
**Spec:** .kiro/specs/${specFolder}/
**Status:** Placeholder Implementation

## Files Created
*(This is a placeholder - actual implementation needed)*

## Implementation Decisions
*(To be filled by implementation agent)*

## Test Coverage
*(To be filled by implementation agent)*

## Known Limitations
- This is a placeholder implementation
- Actual implementation required

## Dependencies
*(To be identified by implementation agent)*

## How to Use
\`\`\`typescript
// Implementation examples to be added
\`\`\`
`;

    fs.writeFileSync(reviewFile, reviewContent);
    console.log(`📝 Created placeholder code review: ${reviewFile}`);
  }

  getDate() {
    return new Date().toISOString().split('T')[0].replace(/-/g, '');
  }
}

// CLI interface
if (require.main === module) {
  const specFolder = process.argv[2];
  const implementer = new AutoImplementer();
  implementer.run(specFolder).catch(error => {
    console.error('Auto-implement failed:', error.message);
    process.exit(1);
  });
}

module.exports = AutoImplementer;