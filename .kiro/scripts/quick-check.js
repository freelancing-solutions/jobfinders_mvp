#!/usr/bin/env node

/**
 * Quick validation check for development
 * Focused on common issues without full analysis
 */

const fs = require('fs');
const path = require('path');

class QuickCheck {
  constructor() {
    this.basePath = path.resolve(__dirname, '..');
    this.specsPath = path.join(this.basePath, 'specs');
    this.issues = [];
  }

  async check() {
    console.log('⚡ Quick Guardian Check...\n');

    this.checkRequiredFiles();
    this.checkDuplicateNames();
    this.checkBrokenLinks();

    if (this.issues.length === 0) {
      console.log('✅ Quick check passed - No obvious issues found');
    } else {
      console.log(`⚠️ ${this.issues.length} issue(s) found:\n`);
      this.issues.forEach((issue, i) => {
        console.log(`${i + 1}. ${issue}`);
      });
    }

    return this.issues.length === 0;
  }

  checkRequiredFiles() {
    const specFolders = this.getDirectories(this.specsPath);

    for (const folder of specFolders) {
      if (folder.startsWith('_')) continue;

      const specPath = path.join(this.specsPath, folder);
      const hasRequirements = fs.existsSync(path.join(specPath, 'requirements.md'));

      if (!hasRequirements) {
        this.issues.push(`Missing requirements.md in ${folder}/`);
      }
    }
  }

  checkDuplicateNames() {
    const specFolders = this.getDirectories(this.specsPath);
    const nameMap = new Map();

    for (const folder of specFolders) {
      if (folder.startsWith('_')) continue;

      const baseName = folder.toLowerCase().replace(/-/g, ' ');
      if (!nameMap.has(baseName)) {
        nameMap.set(baseName, []);
      }
      nameMap.get(baseName).push(folder);
    }

    for (const [name, folders] of nameMap) {
      if (folders.length > 1) {
        this.issues.push(`Similar folder names detected: ${folders.join(', ')}`);
      }
    }
  }

  checkBrokenLinks() {
    // Simple check for obvious broken references
    const readmePath = path.join(this.specsPath, 'README.md');
    if (fs.existsSync(readmePath)) {
      const content = fs.readFileSync(readmePath, 'utf8');
      const links = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];

      for (const link of links) {
        const url = link.match(/\(([^)]+)\)/)[1];
        if (url.startsWith('./') || url.startsWith('../')) {
          const targetPath = path.resolve(path.dirname(readmePath), url);
          if (!fs.existsSync(targetPath)) {
            this.issues.push(`Broken link in README.md: ${url}`);
          }
        }
      }
    }
  }

  getDirectories(dirPath) {
    if (!fs.existsSync(dirPath)) return [];

    return fs.readdirSync(dirPath)
      .filter(file => {
        const fullPath = path.join(dirPath, file);
        return fs.statSync(fullPath).isDirectory();
      });
  }
}

if (require.main === module) {
  const checker = new QuickCheck();
  checker.check().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = QuickCheck;