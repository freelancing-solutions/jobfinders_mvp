const fs = require('fs');
const path = require('path');

// Simple debug script to test Guardian functionality
console.log('Starting Guardian debug...');

try {
  const GuardianClass = require('./.kiro/scripts/guardian.js');
  console.log('Guardian class loaded successfully');
  
  const guardian = new GuardianClass();
  console.log('Guardian instance created');
  
  // Test the problematic method
  const basePath = path.resolve(__dirname, '.kiro');
  const prismaSchema = path.join(basePath, '..', 'prisma', 'schema-complete.prisma');
  const fallbackSchema = path.join(basePath, '..', 'prisma', 'schema-original-backup.prisma');
  
  console.log('Checking schema files:');
  console.log('Complete schema exists:', fs.existsSync(prismaSchema));
  console.log('Fallback schema exists:', fs.existsSync(fallbackSchema));
  
  if (fs.existsSync(prismaSchema)) {
    console.log('Reading complete schema...');
    const content = fs.readFileSync(prismaSchema, 'utf8');
    console.log('Schema content length:', content.length);
    
    const modelMatches = content.match(/model\s+(\w+)/g) || [];
    console.log('Found model matches:', modelMatches.length);
    console.log('First few models:', modelMatches.slice(0, 5));
  }
  
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}