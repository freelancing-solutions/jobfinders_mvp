const fs = require('fs');
const path = require('path');

async function testGuardian() {
  console.log('Testing Guardian validate method...');

  try {
    const GuardianClass = require('./.kiro/scripts/guardian.js');
    const guardian = new GuardianClass();
    
    console.log('Guardian instance created successfully');
    
    // Test each validation step individually
    console.log('\n1. Testing validateSpecs...');
    await guardian.validateSpecs();
    console.log('✅ validateSpecs completed');
    
    console.log('\n2. Testing validateArchitecture...');
    await guardian.validateArchitecture();
    console.log('✅ validateArchitecture completed');
    
    console.log('\n3. Testing checkNamingConsistency...');
    await guardian.checkNamingConsistency();
    console.log('✅ checkNamingConsistency completed');
    
    console.log('\n4. Testing checkDuplicateFeatures...');
    await guardian.checkDuplicateFeatures();
    console.log('✅ checkDuplicateFeatures completed');
    
    console.log('\n5. Testing validateCrossReferences...');
    await guardian.validateCrossReferences();
    console.log('✅ validateCrossReferences completed');
    
    console.log('\n6. Testing checkImplementationCoherence...');
    await guardian.checkImplementationCoherence();
    console.log('✅ checkImplementationCoherence completed');
    
    console.log('\n✅ All validation steps completed successfully');
    
  } catch (error) {
    console.error('\n❌ Error during validation:', error.message);
    console.error('Stack:', error.stack);
  }
}

testGuardian();