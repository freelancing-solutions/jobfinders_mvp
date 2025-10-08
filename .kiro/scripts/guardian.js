#!/usr/bin/env node

/**
 * Spec & Context Guardian
 * Validates consistency and conflicts across .kiro/ specifications
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { execSync } = require('child_process');

class SpecGuardian {
  constructor() {
    this.basePath = path.resolve(__dirname, '..');
    this.specsPath = path.join(this.basePath, 'specs');
    this.architecturePath = path.join(this.basePath, 'architecture');
    this.conflicts = [];
    this.warnings = [];
    this.stats = {
      specs: 0,
      architecture: 0,
      reviews: 0
    };
  }

  /**
   * Run complete validation
   */
  async validate() {
    console.log('🔍 Guardian: Starting validation...\n');

    try {
      await this.validateSpecs();
      await this.validateArchitecture();
      await this.checkNamingConsistency();
      await this.checkDuplicateFeatures();
      await this.validateCrossReferences();
      await this.checkImplementationCoherence();

      this.outputResults();
    } catch (error) {
      console.error('❌ Guardian validation failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Validate all specification files
   */
  async validateSpecs() {
    console.log('📋 Validating specifications...');

    const specFolders = this.getDirectories(this.specsPath);

    for (const folder of specFolders) {
      if (folder.startsWith('_')) continue; // Skip special folders

      const specPath = path.join(this.specsPath, folder);
      this.stats.specs++;

      // Check for required files
      const requiredFiles = ['requirements.md'];
      const hasRequirements = fs.existsSync(path.join(specPath, 'requirements.md'));
      const hasDesign = fs.existsSync(path.join(specPath, 'design.md'));
      const hasTasks = fs.existsSync(path.join(specPath, 'tasks.md'));

      if (!hasRequirements) {
        this.addConflict('MISSING_REQUIREMENTS', [specPath],
          `Missing requirements.md file`, 'Spec is incomplete');
      }

      // Validate spec content
      if (hasRequirements) {
        await this.validateRequirementsFile(path.join(specPath, 'requirements.md'), folder);
      }

      if (hasDesign) {
        await this.validateDesignFile(path.join(specPath, 'design.md'), folder);
      }
    }

    console.log(`✅ Validated ${this.stats.specs} specification folders`);
  }

  /**
   * Validate architecture files
   */
  async validateArchitecture() {
    console.log('🏗️ Validating architecture documents...');

    if (!fs.existsSync(this.architecturePath)) {
      this.addWarning('Missing architecture directory');
      return;
    }

    const archFiles = fs.readdirSync(this.architecturePath);
    this.stats.architecture = archFiles.length;

    for (const file of archFiles) {
      if (file.endsWith('.md')) {
        const filePath = path.join(this.architecturePath, file);
        await this.validateArchitectureFile(filePath, file);
      }
    }

    console.log(`✅ Validated ${this.stats.architecture} architecture documents`);
  }

  /**
   * Check naming consistency across files
   */
  checkNamingConsistency() {
    console.log('🔤 Checking naming consistency...');

    const namingMap = new Map();
    const specFolders = this.getDirectories(this.specsPath);

    for (const folder of specFolders) {
      if (folder.startsWith('_')) continue;

      const reqPath = path.join(this.specsPath, folder, 'requirements.md');
      if (!fs.existsSync(reqPath)) continue;

      const content = fs.readFileSync(reqPath, 'utf8');

      // Extract key terms
      const terms = this.extractKeyTerms(content);
      for (const term of terms) {
        if (!namingMap.has(term)) {
          namingMap.set(term, []);
        }
        namingMap.get(term).push(folder);
      }
    }

    // Check for inconsistencies
    for (const [term, locations] of namingMap) {
      if (locations.length > 1) {
        // Check if these are legitimate duplicates or naming conflicts
        const baseNames = locations.map(loc => loc.replace(/-/g, ' '));
        const uniqueNames = [...new Set(baseNames)];

        if (uniqueNames.length > 1) {
          this.addConflict('NAMING_INCONSISTENCY', locations,
            `Term "${term}" appears with different naming: ${uniqueNames.join(', ')}`,
            'May cause confusion in implementation');
        }
      }
    }

    console.log('✅ Naming consistency check completed');
  }

  /**
   * Check for duplicate feature definitions
   */
  checkDuplicateFeatures() {
    console.log('🔄 Checking for duplicate features...');

    const featureMap = new Map();
    const specFolders = this.getDirectories(this.specsPath);

    for (const folder of specFolders) {
      if (folder.startsWith('_')) continue;

      const reqPath = path.join(this.specsPath, folder, 'requirements.md');
      if (!fs.existsSync(reqPath)) continue;

      const content = fs.readFileSync(reqPath, 'utf8');
      const features = this.extractFeatures(content);

      for (const feature of features) {
        const key = feature.toLowerCase().replace(/\s+/g, '-');
        if (!featureMap.has(key)) {
          featureMap.set(key, []);
        }
        featureMap.get(key).push({
          folder,
          feature,
          description: feature
        });
      }
    }

    // Identify potential duplicates
    for (const [key, instances] of featureMap) {
      if (instances.length > 1) {
        // Check if these are actually duplicates or related features
        const descriptions = instances.map(i => i.description);
        const similarity = this.calculateSimilarity(descriptions);

        if (similarity > 0.8) {
          this.addConflict('FEATURE_DUPLICATION', instances.map(i => i.folder),
            `Duplicate feature detected: "${instances[0].feature}"`,
            'Same functionality defined in multiple specs');
        }
      }
    }

    console.log('✅ Duplicate feature check completed');
  }

  /**
   * Validate cross-references between documents
   */
  validateCrossReferences() {
    console.log('🔗 Validating cross-references...');

    const allFiles = this.getAllMarkdownFiles();
    const references = new Map();

    // Extract all references
    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const refs = this.extractReferences(content);

      for (const ref of refs) {
        if (!references.has(ref)) {
          references.set(ref, []);
        }
        references.get(ref).push(file);
      }
    }

    // Validate references exist
    for (const [ref, referringFiles] of references) {
      if (ref.startsWith('./') || ref.startsWith('../')) {
        // Relative reference - check if target exists
        const referringFile = referringFiles[0];
        const basePath = path.dirname(referringFile);
        const targetPath = path.resolve(basePath, ref);

        if (!fs.existsSync(targetPath)) {
          this.addConflict('BROKEN_REFERENCE', referringFiles,
            `Broken reference: ${ref}`,
            'Referenced file does not exist');
        }
      }
    }

    console.log('✅ Cross-reference validation completed');
  }

  /**
   * Check implementation coherence with actual codebase
   */
  async checkImplementationCoherence() {
    console.log('🔍 Checking implementation coherence...');

    // Check if specs align with actual Prisma schema
    const prismaSchema = path.join(this.basePath, '..', 'prisma', 'schema-complete.prisma');
    const fallbackSchema = path.join(this.basePath, '..', 'prisma', 'schema-original-backup.prisma');
    
    if (fs.existsSync(prismaSchema)) {
      await this.validatePrismaAlignment(prismaSchema);
    } else if (fs.existsSync(fallbackSchema)) {
      await this.validatePrismaAlignment(fallbackSchema);
    }

    // Check git status for uncommitted changes in .kiro/
    try {
      const gitStatus = execSync('git status --porcelain .kiro/', {
        encoding: 'utf8',
        cwd: this.basePath
      });

      if (gitStatus.trim()) {
        this.addWarning('Uncommitted changes in .kiro/ folder',
          'These changes should be reviewed before commit');
      }
    } catch (error) {
      // Git not available or not in git repo
    }

    console.log('✅ Implementation coherence check completed');
  }

  /**
   * Validate requirements file structure and content
   */
  async validateRequirementsFile(filePath, specName) {
    const content = fs.readFileSync(filePath, 'utf8');

    // Check for required sections
    const requiredSections = ['## Overview', '## Requirements'];
    const missingSections = requiredSections.filter(section =>
      !content.includes(section)
    );

    if (missingSections.length > 0) {
      this.addConflict('MISSING_SECTIONS', [filePath],
        `Missing required sections: ${missingSections.join(', ')}`,
        'Requirements file structure is incomplete');
    }

    // Validate requirement numbering
    const reqPattern = /REQ-(\d+)/g;
    const requirements = content.match(reqPattern) || [];
    const numbers = requirements.map(req => parseInt(req.split('-')[1]));

    if (numbers.length > 0) {
      const maxNumber = Math.max(...numbers);
      if (maxNumber > 899) {
        this.addConflict('INVALID_REQUIREMENT_NUMBER', [filePath],
          `Requirement number ${maxNumber} exceeds maximum (899)`,
          'Use standard requirement numbering scheme');
      }
    }
  }

  /**
   * Validate design file structure and content
   */
  async validateDesignFile(filePath, specName) {
    const content = fs.readFileSync(filePath, 'utf8');

    // Check for technical design elements
    const technicalElements = ['API', 'Database', 'Architecture', 'Components'];
    const hasTechnical = technicalElements.some(element =>
      content.toLowerCase().includes(element.toLowerCase())
    );

    if (!hasTechnical) {
      this.addWarning(`Design file ${filePath} lacks technical details`,
        'Should include API, database, or architecture information');
    }
  }

  /**
   * Validate architecture file
   */
  async validateArchitectureFile(filePath, fileName) {
    const content = fs.readFileSync(filePath, 'utf8');

    // Check for Mermaid diagrams or structured content
    const hasDiagrams = content.includes('```mermaid') ||
                       content.includes('graph TD') ||
                       content.includes('flowchart');

    if (!hasDiagrams && fileName.includes('overview')) {
      this.addWarning(`Architecture overview ${filePath} lacks diagrams`,
        'Consider adding Mermaid diagrams for better visualization');
    }
  }

  /**
   * Validate alignment with Prisma schema
   */
  async validatePrismaAlignment(prismaPath) {
    const prismaContent = fs.readFileSync(prismaPath, 'utf8');

    // Extract model names from Prisma schema
    const modelMatches = prismaContent.match(/^model\s+(\w+)/gm) || [];
    const prismaModels = modelMatches.map(match => {
      const parts = match.trim().split(/\s+/);
      return parts.length > 1 ? parts[1] : null;
    }).filter(model => model !== null && model.length > 0);

    // Check if specs reference these models
    for (const model of prismaModels) {
      if (!model) continue; // Skip null/undefined models
      
      const modelLower = model.toLowerCase();
      let foundInSpecs = false;

      const specFolders = this.getDirectories(this.specsPath);
      for (const folder of specFolders) {
        if (folder.startsWith('_')) continue;

        const reqPath = path.join(this.specsPath, folder, 'requirements.md');
        if (fs.existsSync(reqPath)) {
          const content = fs.readFileSync(reqPath, 'utf8');
          if (content.toLowerCase().includes(modelLower)) {
            foundInSpecs = true;
            break;
          }
        }
      }

      if (!foundInSpecs) {
        this.addWarning(`Prisma model "${model}" not referenced in any spec`,
          'Consider documenting this model in relevant specifications');
      }
    }
  }

  /**
   * Extract key terms from content
   */
  extractKeyTerms(content) {
    const terms = [];

    // Extract proper nouns and technical terms
    const words = content.match(/\b[A-Z][a-z]+(?:[A-Z][a-z]+)*\b/g) || [];

    // Filter common words
    const filtered = words.filter(word =>
      !['API', 'UI', 'UX', 'JSON', 'URL', 'HTTP'].includes(word) &&
      word.length > 3
    );

    return [...new Set(filtered)];
  }

  /**
   * Extract features from requirements
   */
  extractFeatures(content) {
    const features = [];

    // Look for bullet points that describe features
    const lines = content.split('\n');
    let currentSection = '';

    for (const line of lines) {
      if (line.startsWith('##')) {
        currentSection = line;
        continue;
      }

      if (line.match(/^[-*]\s+/) && currentSection.includes('Requirements')) {
        const feature = line.replace(/^[-*]\s+/, '').trim();
        if (feature.length > 10) { // Skip very short items
          features.push(feature);
        }
      }
    }

    return features;
  }

  /**
   * Extract references from content
   */
  extractReferences(content) {
    const references = [];

    // Extract markdown links
    const linkMatches = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
    for (const match of linkMatches) {
      const url = match.match(/\(([^)]+)\)/)[1];
      if (url.startsWith('./') || url.startsWith('../')) {
        references.push(url);
      }
    }

    return references;
  }

  /**
   * Calculate similarity between text descriptions
   */
  calculateSimilarity(descriptions) {
    if (descriptions.length < 2) return 0;

    const words1 = descriptions[0].toLowerCase().split(/\s+/);
    const words2 = descriptions[1].toLowerCase().split(/\s+/);

    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];

    return intersection.length / union.length;
  }

  /**
   * Get all directories in a path
   */
  getDirectories(dirPath) {
    if (!fs.existsSync(dirPath)) return [];

    return fs.readdirSync(dirPath)
      .filter(file => {
        const fullPath = path.join(dirPath, file);
        return fs.statSync(fullPath).isDirectory();
      });
  }

  /**
   * Get all markdown files recursively
   */
  getAllMarkdownFiles() {
    const files = [];

    const scan = (dirPath) => {
      if (!fs.existsSync(dirPath)) return;

      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.startsWith('.')) {
          scan(fullPath);
        } else if (item.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    };

    scan(this.specsPath);
    scan(this.architecturePath);

    return files;
  }

  /**
   * Add a conflict to the list
   */
  addConflict(category, files, issue, impact) {
    this.conflicts.push({
      category,
      files,
      issue,
      impact,
      resolution: this.suggestResolution(category, issue)
    });
  }

  /**
   * Add a warning to the list
   */
  addWarning(message, suggestion = '') {
    this.warnings.push({
      message,
      suggestion
    });
  }

  /**
   * Suggest resolution for conflicts
   */
  suggestResolution(category, issue) {
    const resolutions = {
      'MISSING_REQUIREMENTS': 'Add requirements.md file with proper structure',
      'MISSING_SECTIONS': 'Add missing sections to follow template format',
      'INVALID_REQUIREMENT_NUMBER': 'Use standard numbering: REQ-001-499 (functional), REQ-500-699 (non-functional)',
      'NAMING_INCONSISTENCY': 'Standardize terminology across all specifications',
      'FEATURE_DUPLICATION': 'Consolidate duplicate features or clarify differences',
      'BROKEN_REFERENCE': 'Update or remove broken references',
      'DATA_MODEL_CONFLICT': 'Align data models across specifications'
    };

    return resolutions[category] || 'Review and resolve the inconsistency';
  }

  /**
   * Output validation results
   */
  outputResults() {
    console.log('\n' + '='.repeat(60));
    console.log('🛡️ GUARDIAN VALIDATION RESULTS');
    console.log('='.repeat(60));

    if (this.conflicts.length === 0 && this.warnings.length === 0) {
      console.log('✅ Context validated - No conflicts detected');
      console.log(`└─ Checked: ${this.stats.specs} specs, ${this.stats.architecture} architecture docs`);
      process.exit(0);
    }

    // Output conflicts
    if (this.conflicts.length > 0) {
      console.log(`\n⚠️ ${this.conflicts.length} CONFLICT(S) DETECTED:\n`);

      for (const conflict of this.conflicts) {
        console.log(`⚠️ CONFLICT DETECTED: ${conflict.category}`);
        console.log(`├─ Affected Files: ${conflict.files.map(f => path.relative(this.basePath, f)).join(', ')}`);
        console.log(`├─ Issue: ${conflict.issue}`);
        console.log(`├─ Impact: ${conflict.impact}`);
        console.log(`└─ Resolution: ${conflict.resolution}\n`);
      }
    }

    // Output warnings
    if (this.warnings.length > 0) {
      console.log(`\n⚡ ${this.warnings.length} WARNING(S):\n`);

      for (const warning of this.warnings) {
        console.log(`⚡ ${warning.message}`);
        if (warning.suggestion) {
          console.log(`└─ Suggestion: ${warning.suggestion}`);
        }
        console.log();
      }
    }

    console.log('='.repeat(60));
    console.log(`📊 SUMMARY: ${this.stats.specs} specs, ${this.stats.architecture} architecture docs checked`);
    console.log(`🚨 ${this.conflicts.length} conflicts, ${this.warnings.length} warnings`);
    console.log('='.repeat(60));

    if (this.conflicts.length > 0) {
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const guardian = new SpecGuardian();
  guardian.validate().catch(error => {
    console.error('Guardian failed:', error);
    process.exit(1);
  });
}

module.exports = SpecGuardian;