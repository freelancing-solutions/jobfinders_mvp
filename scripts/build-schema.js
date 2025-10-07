#!/usr/bin/env node

/**
 * Schema Build Script
 *
 * This script concatenates all separated schema files into a single schema file
 * that can be used by Prisma for development and production.
 */

const fs = require('fs');
const path = require('path');

const schemaDir = path.join(__dirname, '../prisma/schema');
const outputFile = path.join(__dirname, '../prisma/schema-complete.prisma');

// Order of schema files (important for dependencies)
const schemaFiles = [
  'base.prisma',
  'auth.prisma',
  'jobs.prisma',
  'applications.prisma',
  'resumes.prisma',
  'company.prisma',
  'billing.prisma',
  'notifications.prisma',
  'analytics.prisma',
  'templates.prisma',
  'matching.prisma'
];

console.log('🔧 Building Prisma schema from separated modules...\n');

try {
  // Ensure schema directory exists
  if (!fs.existsSync(schemaDir)) {
    console.error('❌ Schema directory not found:', schemaDir);
    process.exit(1);
  }

  // Read and concatenate all schema files
  let combinedSchema = '';
  let processedFiles = 0;

  for (const file of schemaFiles) {
    const filePath = path.join(schemaDir, file);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ Schema file not found: ${file}`);
      process.exit(1);
    }

    const content = fs.readFileSync(filePath, 'utf8');

    // Add file header comment
    combinedSchema += `\n// ================================================================\n`;
    combinedSchema += `// ${file.toUpperCase().replace('.PRISMA',')} SCHEMA\n`;
    combinedSchema += `// ================================================================\n\n`;

    // Add file content
    combinedSchema += content;
    combinedSchema += '\n\n';

    processedFiles++;
    console.log(`✅ Processed: ${file}`);
  }

  // Add build metadata
  const buildHeader = `// ================================================================\n`;
  combinedSchema = buildHeader +
    `// GENERATED SCHEMA FILE - DO NOT EDIT DIRECTLY\n` +
    `// Built from separated schema modules\n` +
    `// Generated at: ${new Date().toISOString()}\n` +
    `// Total files processed: ${processedFiles}\n` +
    `// ================================================================\n\n` +
    combinedSchema;

  // Write the combined schema to output file
  fs.writeFileSync(outputFile, combinedSchema);

  console.log(`\n🎉 Schema build completed successfully!`);
  console.log(`📁 Output file: ${outputFile}`);
  console.log(`📊 Processed ${processedFiles} schema files`);

  // Show file size
  const stats = fs.statSync(outputFile);
  console.log(`📏 Output size: ${(stats.size / 1024).toFixed(2)} KB`);

} catch (error) {
  console.error('❌ Error building schema:', error.message);
  process.exit(1);
}