#!/usr/bin/env node

/**
 * Schema Test Script
 *
 * Simple test to verify all schema files exist and are readable
 */

const fs = require('fs');
const path = require('path');

const schemaDir = path.join(__dirname, '../prisma/schema');
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

console.log('🧪 Testing Prisma schema separation...\n');

let allFilesExist = true;
let totalSize = 0;

for (const file of schemaFiles) {
  const filePath = path.join(schemaDir, file);

  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    totalSize += stats.size;
    console.log(`✅ ${file} - ${sizeKB} KB`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
}

console.log(`\n📊 Total schema size: ${(totalSize / 1024).toFixed(2)} KB`);

if (allFilesExist) {
  console.log('\n🎉 All schema files are present and accessible!');

  // Check if backup was created
  const backupPath = path.join(__dirname, '../prisma/schema-original-backup.prisma');
  if (fs.existsSync(backupPath)) {
    console.log('✅ Original schema backup created');
  } else {
    console.log('⚠️  Original schema backup not found');
  }

  console.log('\n📝 Next steps:');
  console.log('1. Run "npm run schema:build" to create the complete schema');
  console.log('2. Run "npm run schema:dev" for development');
  console.log('3. Run "npm run schema:prod" for production');
} else {
  console.log('\n❌ Some schema files are missing. Please check the implementation.');
  process.exit(1);
}