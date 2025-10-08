const fs = require('fs');
const path = require('path');

console.log('Testing Guardian regex fix...');

try {
  const basePath = path.resolve(__dirname, '.kiro');
  const prismaSchema = path.join(basePath, '..', 'prisma', 'schema-complete.prisma');
  
  if (fs.existsSync(prismaSchema)) {
    console.log('Reading schema file...');
    const content = fs.readFileSync(prismaSchema, 'utf8');
    
    // Test the old regex
    const oldMatches = content.match(/model\s+(\w+)/g) || [];
    console.log('Old regex matches:', oldMatches.length);
    console.log('First 5 old matches:', oldMatches.slice(0, 5));
    
    // Test the new regex
    const newMatches = content.match(/^model\s+(\w+)/gm) || [];
    console.log('New regex matches:', newMatches.length);
    console.log('First 5 new matches:', newMatches.slice(0, 5));
    
    // Extract model names with new method
    const prismaModels = newMatches.map(match => {
      const parts = match.trim().split(/\s+/);
      return parts.length > 1 ? parts[1] : null;
    }).filter(model => model !== null && model.length > 0);
    
    console.log('Extracted models:', prismaModels.length);
    console.log('First 10 models:', prismaModels.slice(0, 10));
    
  } else {
    console.log('Schema file not found');
  }
  
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}