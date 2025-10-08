// Test script to debug Guardian issues
const SpecGuardian = require('./.kiro/scripts/guardian.js');

console.log('Starting Guardian test...');

const guardian = new SpecGuardian();

guardian.validate()
  .then(() => {
    console.log('Guardian completed successfully');
  })
  .catch(error => {
    console.error('Guardian error:', error);
    console.error('Stack trace:', error.stack);
  });