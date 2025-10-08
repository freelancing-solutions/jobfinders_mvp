# Guardian Setup Guide

## 🛡️ Installing the Guardian System

The Guardian system has been successfully implemented for the JobFinders project. Follow these steps to set it up:

### 1. Install Dependencies

Navigate to the `.kiro` directory and install the required packages:

```bash
cd .kiro
npm install
```

This will install `js-yaml` which is needed for parsing YAML configuration files.

### 2. Install Git Hooks

Set up automatic validation before commits:

```bash
npm run guardian:install
```

Or from the project root:
```bash
npm run guardian:install
```

### 3. Test the Installation

Run a quick validation test:

```bash
npm run guardian:quick
```

Or run the full validation:
```bash
npm run guardian
```

## 🚀 Available Commands

### From Project Root
```bash
# Full validation
npm run guardian

# Quick check (common issues only)
npm run guardian:quick

# Install git hooks
npm run guardian:install
```

### Using the CLI directly
```bash
# Full validation
node .kiro/bin/guardian validate

# Quick check
node .kiro/bin/guardian quick

# Show statistics
node .kiro/bin/guardian stats

# Install hooks
node .kiro/bin/guardian install-hooks
```

## 📊 What the Guardian Checks

### Structure Validation
- ✅ All spec folders have required files (requirements.md)
- ✅ Proper section headers in specification documents
- ✅ Valid requirement numbering (REQ-001 to REQ-899)
- ✅ Architecture documents follow expected format

### Consistency Validation
- ✅ Naming consistency across specifications
- ✅ No duplicate feature definitions
- ✅ Cross-references are valid and working
- ✅ Implementation coherence with actual codebase

### Integration Validation
- ✅ Alignment with Prisma schema
- ✅ Git status for uncommitted .kiro changes
- ✅ Broken links and references

## 🔧 How It Works

### Pre-commit Hook
When you try to commit changes to `.kiro/` files, the Guardian:
1. Detects if .kiro files have changed
2. Runs full validation
3. Blocks the commit if conflicts are found
4. Allows the commit if validation passes

### Manual Validation
You can run validation manually at any time:
- Use `npm run guardian:quick` for fast development checks
- Use `npm run guardian` for comprehensive validation before releases

### CI/CD Integration
Add this to your CI pipeline:
```yaml
- name: Validate specifications
  run: npm run guardian
```

## 📋 Troubleshooting

### Guardian fails during commit
1. Look at the conflict messages
2. Fix the identified issues
3. Try committing again

### Missing dependencies
```bash
cd .kiro
npm install
```

### Git hooks not working
```bash
npm run guardian:install
```

### Permission issues on Windows
If you get permission errors, run PowerShell as Administrator and execute:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 🎯 Best Practices

1. **Before making changes**: Run `npm run guardian:quick`
2. **Before committing**: Guardian runs automatically
3. **Before releases**: Run `npm run guardian` for full validation
4. **Regular maintenance**: Run validation weekly to catch drift

## 📚 Guardian Components

- **`scripts/guardian.js`** - Main validation engine
- **`scripts/quick-check.js`** - Fast development checks
- **`scripts/install-hooks.js`** - Git hook installation
- **`bin/guardian`** - CLI wrapper with multiple commands
- **`README.md`** - Complete documentation

## ✅ Success Indicators

When the Guardian is working correctly, you'll see:
```
✅ Context validated - No conflicts detected
└─ Checked: [N] specs, [M] architecture docs
```

Or for quick checks:
```
✅ Quick check passed - No obvious issues found
```

---

**The Guardian is now ready to protect your project's specification integrity!**