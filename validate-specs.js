const fs = require('fs');
const path = require('path');

const specsDir = '.kiro/specs';

try {
  const items = fs.readdirSync(specsDir, { withFileTypes: true });

  console.log('=== .kiro/specs Directory Structure ===\n');

  const directories = items
    .filter(item => item.isDirectory())
    .map(item => item.name)
    .filter(name => !name.startsWith('_'))
    .sort();

  const archivedDirs = items
    .filter(item => item.isDirectory())
    .map(item => item.name)
    .filter(name => name.startsWith('_'))
    .sort();

  console.log('Active Specifications:');
  directories.forEach(dir => {
    const dirPath = path.join(specsDir, dir);
    const files = fs.readdirSync(dirPath);
    const hasRequirements = files.includes('requirements.md');
    const hasDesign = files.includes('design.md');
    const hasTasks = files.includes('tasks.md');

    console.log(`  ${dir}/`);
    console.log(`    requirements.md: ${hasRequirements ? '✓' : '✗'}`);
    console.log(`    design.md: ${hasDesign ? '✓' : '✗'}`);
    console.log(`    tasks.md: ${hasTasks ? '✓' : '✗'}`);
    if (!hasRequirements) {
      console.log(`    ⚠️  MISSING requirements.md - CRITICAL`);
    }
    console.log('');
  });

  console.log('\nArchived Directories:');
  archivedDirs.forEach(dir => {
    console.log(`  ${dir}/`);
  });

  console.log('\n=== Validation Summary ===');

  // Check for critical issues
  let criticalIssues = 0;
  let warnings = 0;

  directories.forEach(dir => {
    const dirPath = path.join(specsDir, dir);
    const files = fs.readdirSync(dirPath);
    const hasRequirements = files.includes('requirements.md');

    if (!hasRequirements) {
      criticalIssues++;
    }
  });

  console.log(`Active specifications: ${directories.length}`);
  console.log(`Critical issues (missing requirements.md): ${criticalIssues}`);

  if (criticalIssues > 0) {
    console.log('\n🚨 CRITICAL ISSUES FOUND:');
    console.log('- Specifications without requirements.md files cannot be implemented');
    console.log('- Each active specification must have a requirements.md file');
  } else {
    console.log('\n✅ All active specifications have requirements.md files');
  }

} catch (error) {
  console.error('Error reading specs directory:', error.message);
}