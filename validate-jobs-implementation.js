const fs = require('fs');
const path = require('path');

// Simple Guardian validation for Jobs Listing Page implementation
console.log('🔍 Starting Guardian validation for Jobs Listing Page...\n');

const basePath = __dirname;
const srcPath = path.join(basePath, 'src');
const kiroPath = path.join(basePath, '.kiro');

let conflicts = [];
let warnings = [];

console.log('📋 Checking Jobs Listing Page implementation...');

// 1. Check if jobs listing files exist
const jobsPagePath = path.join(srcPath, 'app', 'jobs', 'page.tsx');
const jobsLayoutPath = path.join(srcPath, 'app', 'jobs', 'layout.tsx');
const jobDetailPath = path.join(srcPath, 'app', 'jobs', '[id]', 'page.tsx');

const requiredFiles = [
  { path: jobsPagePath, name: 'Jobs listing page' },
  { path: jobsLayoutPath, name: 'Jobs layout' },
  { path: jobDetailPath, name: 'Job detail page' }
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file.path)) {
    conflicts.push({
      type: 'MISSING_FILE',
      file: file.name,
      path: file.path,
      message: `Required ${file.name} not found`
    });
  } else {
    console.log(`✅ ${file.name} exists`);
  }
}

// 2. Check for API endpoint consistency
const apiEndpointPath = path.join(srcPath, 'app', 'api', 'jobs');
if (!fs.existsSync(apiEndpointPath)) {
  warnings.push({
    type: 'MISSING_API',
    message: 'Jobs API endpoint not found at src/app/api/jobs'
  });
} else {
  console.log('✅ Jobs API endpoint exists');
}

// 3. Check for component consistency
const componentsPath = path.join(srcPath, 'components');
const jobComponents = [
  'job-listing',
  'job-card',
  'job-filters',
  'job-search'
];

for (const component of jobComponents) {
  const componentPath = path.join(componentsPath, `${component}.tsx`);
  if (!fs.existsSync(componentPath)) {
    warnings.push({
      type: 'MISSING_COMPONENT',
      component: component,
      message: `Component ${component} not found`
    });
  }
}

// 4. Check for UI consistency
const uiPath = path.join(componentsPath, 'ui');
const requiredUI = ['button', 'input', 'card', 'badge'];

for (const ui of requiredUI) {
  const uiPathFull = path.join(uiPath, `${ui}.tsx`);
  if (!fs.existsSync(uiPathFull)) {
    conflicts.push({
      type: 'MISSING_UI',
      component: ui,
      message: `Required UI component ${ui} not found`
    });
  }
}

// 5. Check for type definitions
const typesPath = path.join(srcPath, 'types');
if (!fs.existsSync(typesPath)) {
  warnings.push({
    type: 'MISSING_TYPES',
    message: 'Types directory not found'
  });
}

// 6. Check database schema alignment
const prismaPath = path.join(basePath, 'prisma', 'schema.prisma');
if (fs.existsSync(prismaPath)) {
  const prismaContent = fs.readFileSync(prismaPath, 'utf8');
  if (!prismaContent.includes('model Job')) {
    conflicts.push({
      type: 'SCHEMA_MISMATCH',
      message: 'Job model not found in Prisma schema'
    });
  } else {
    console.log('✅ Job model found in Prisma schema');
  }
}

// 7. Check for routing conflicts
const appPath = path.join(srcPath, 'app');
const potentialConflicts = ['job', 'careers', 'positions'];

for (const conflict of potentialConflicts) {
  const conflictPath = path.join(appPath, conflict);
  if (fs.existsSync(conflictPath) && conflict !== 'jobs') {
    warnings.push({
      type: 'POTENTIAL_ROUTING_CONFLICT',
      path: conflict,
      message: `Potential routing conflict with /${conflict} route`
    });
  }
}

// 8. Check .kiro specs
const specsPath = path.join(kiroPath, 'specs');
if (fs.existsSync(specsPath)) {
  const jobsSpecPath = path.join(specsPath, 'jobs-listing-page');
  if (fs.existsSync(jobsSpecPath)) {
    console.log('✅ Jobs listing page spec found');
  } else {
    warnings.push({
      type: 'MISSING_SPEC',
      message: 'Jobs listing page specification not found'
    });
  }
}

// Output results
console.log('\n' + '='.repeat(60));
console.log('🛡️ GUARDIAN VALIDATION RESULTS');
console.log('='.repeat(60));

if (conflicts.length === 0 && warnings.length === 0) {
  console.log('✅ Jobs Listing Page implementation validated - No conflicts detected');
  console.log('└─ Ready for next phase of development');
} else {
  // Output conflicts
  if (conflicts.length > 0) {
    console.log(`\n⚠️ ${conflicts.length} CONFLICT(S) DETECTED:\n`);

    for (const conflict of conflicts) {
      console.log(`⚠️ CONFLICT: ${conflict.type}`);
      console.log(`├─ File: ${conflict.file || conflict.component || 'N/A'}`);
      console.log(`├─ Path: ${conflict.path || 'N/A'}`);
      console.log(`└─ Issue: ${conflict.message}\n`);
    }
  }

  // Output warnings
  if (warnings.length > 0) {
    console.log(`\n⚡ ${warnings.length} WARNING(S):\n`);

    for (const warning of warnings) {
      console.log(`⚡ WARNING: ${warning.type}`);
      console.log(`└─ ${warning.message}\n`);
    }
  }
}

console.log('='.repeat(60));
console.log(`📊 SUMMARY: ${conflicts.length} conflicts, ${warnings.length} warnings`);
console.log('='.repeat(60));

if (conflicts.length > 0) {
  console.log('\n❌ Implementation has conflicts - Please resolve before proceeding');
  process.exit(1);
} else {
  console.log('\n✅ Implementation is conflict-free and ready for the next phase');
}