#!/usr/bin/env node

/**
 * Install git hooks for the Guardian system
 */

const fs = require('fs');
const path = require('path');

function installHooks() {
  const hooksDir = path.join(__dirname, '..', '.git', 'hooks');
  const preCommitHook = path.join(hooksDir, 'pre-commit');
  const guardianPath = path.join(__dirname, 'guardian.js');

  // Ensure .git/hooks directory exists
  if (!fs.existsSync(hooksDir)) {
    console.error('❌ .git/hooks directory not found. Is this a git repository?');
    process.exit(1);
  }

  // Create pre-commit hook
  const hookContent = `#!/bin/sh
# Guardian pre-commit hook
# Runs spec validation before allowing commits

echo "🔍 Running Guardian validation..."

# Only run if .kiro files changed
if git diff --cached --name-only | grep -q "^\\.kiro/"; then
    node "${guardianPath}"
    if [ $? -ne 0 ]; then
        echo "❌ Guardian validation failed. Commit blocked."
        echo "Fix the conflicts before committing."
        exit 1
    fi
    echo "✅ Guardian validation passed. Commit allowed."
else
    echo "✅ No .kiro files changed. Skipping Guardian validation."
fi

exit 0
`;

  try {
    fs.writeFileSync(preCommitHook, hookContent, { mode: 0o755 });
    console.log('✅ Guardian pre-commit hook installed successfully');
    console.log('   The Guardian will now validate .kiro files before each commit');
  } catch (error) {
    console.error('❌ Failed to install pre-commit hook:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  installHooks();
}

module.exports = { installHooks };