const fs = require('fs');
const path = require('path');

// Simple validation function that doesn't require external dependencies
function validateSpecs() {
  const specsDir = '.kiro/specs';

  try {
    const items = fs.readdirSync(specsDir, { withFileTypes: true });

    const directories = items
      .filter(item => item.isDirectory())
      .map(item => item.name)
      .filter(name => !name.startsWith('_') && !name.startsWith('.'))
      .sort();

    console.log('=== .kiro/specs Validation Check ===\n');

    let criticalIssues = 0;
    let warnings = 0;
    let validSpecs = 0;

    console.log('Active Specifications:');
    directories.forEach(dir => {
      const dirPath = path.join(specsDir, dir);
      const files = fs.readdirSync(dirPath);
      const hasRequirements = files.includes('requirements.md');
      const hasDesign = files.includes('design.md');
      const hasTasks = files.includes('tasks.md');

      console.log(`  ${dir}/`);
      console.log(`    requirements.md: ${hasRequirements ? '✓' : '✗'}`);
      console.log(`    design.md: ${hasDesign ? '✓' : '-'}`);
      console.log(`    tasks.md: ${hasTasks ? '✓' : '-'}`);

      if (!hasRequirements) {
        console.log(`    🚨 CRITICAL: Missing requirements.md`);
        criticalIssues++;
      } else {
        validSpecs++;

        // Check if requirements.md is readable and has content
        try {
          const reqPath = path.join(dirPath, 'requirements.md');
          const reqContent = fs.readFileSync(reqPath, 'utf8');
          if (reqContent.length < 100) {
            console.log(`    ⚠️  WARNING: requirements.md appears incomplete`);
            warnings++;
          }
        } catch (error) {
          console.log(`    🚨 CRITICAL: Cannot read requirements.md`);
          criticalIssues++;
        }
      }
      console.log('');
    });

    // Check for potential conflicts by looking at file names
    const conflictCandidates = directories.filter(dir =>
      dir.includes('-updated') || dir.includes('-v2') || dir.includes('-old')
    );

    if (conflictCandidates.length > 0) {
      console.log('Potential Version Conflicts:');
      conflictCandidates.forEach(dir => {
        console.log(`  ⚠️  ${dir} - May have multiple versions`);
        warnings++;
      });
      console.log('');
    }

    console.log('=== Validation Summary ===');
    console.log(`Total specifications found: ${directories.length}`);
    console.log(`Valid specifications: ${validSpecs}`);
    console.log(`Critical issues: ${criticalIssues}`);
    console.log(`Warnings: ${warnings}`);

    if (criticalIssues > 0) {
      console.log('\n🚨 CRITICAL ISSUES DETECTED');
      console.log('Cannot proceed with implementation until critical issues are resolved:');
      console.log('- Missing requirements.md files prevent implementation');
      console.log('- Unreadable requirements.md files need to be fixed');
      return false;
    } else if (warnings > 0) {
      console.log('\n⚠️  MINOR ISSUES DETECTED');
      console.log('Can proceed with implementation, but consider addressing warnings:');
      console.log('- Version conflicts may cause confusion');
      console.log('- Incomplete requirements may need review');
      return true;
    } else {
      console.log('\n✅ VALIDATION PASSED');
      console.log('All specifications are ready for implementation');
      return true;
    }

  } catch (error) {
    console.error('Error during validation:', error.message);
    return false;
  }
}

// Run validation
const isSafeToProceed = validateSpecs();
process.exit(isSafeToProceed ? 0 : 1);