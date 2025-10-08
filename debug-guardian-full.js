const fs = require('fs');
const path = require('path');

async function testFullGuardian() {
  console.log('Testing Full Guardian validation...');

  try {
    const GuardianClass = require('./.kiro/scripts/guardian.js');
    const guardian = new GuardianClass();
    
    console.log('Guardian instance created successfully');
    
    // Run full validation but capture results instead of exiting
    await guardian.validateSpecs();
    await guardian.validateArchitecture();
    await guardian.checkNamingConsistency();
    await guardian.checkDuplicateFeatures();
    await guardian.validateCrossReferences();
    await guardian.checkImplementationCoherence();
    
    // Show results without exiting
    console.log('\n=== GUARDIAN RESULTS ===');
    console.log(`Conflicts found: ${guardian.conflicts.length}`);
    console.log(`Warnings found: ${guardian.warnings.length}`);
    
    if (guardian.conflicts.length > 0) {
      console.log('\n🚨 CONFLICTS:');
      guardian.conflicts.forEach((conflict, index) => {
        console.log(`${index + 1}. [${conflict.category}] ${conflict.issue}`);
        console.log(`   Files: ${conflict.files.join(', ')}`);
        console.log(`   Impact: ${conflict.impact}`);
        console.log(`   Resolution: ${conflict.resolution}`);
        console.log();
      });
    }
    
    if (guardian.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      guardian.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning.message}`);
        if (warning.suggestion) {
          console.log(`   Suggestion: ${warning.suggestion}`);
        }
        console.log();
      });
    }
    
    console.log(`\n📊 SUMMARY: ${guardian.stats.specs} specs, ${guardian.stats.architecture} architecture docs checked`);
    console.log(`🚨 ${guardian.conflicts.length} conflicts, ${guardian.warnings.length} warnings`);
    
  } catch (error) {
    console.error('\n❌ Error during validation:', error.message);
    console.error('Stack:', error.stack);
  }
}

testFullGuardian();