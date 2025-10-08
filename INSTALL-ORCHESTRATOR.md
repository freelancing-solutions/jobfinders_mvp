# Install Orchestrator System

## 🚀 Quick Installation

### Step 1: Test Current System
```bash
node .kiro/scripts/guardian-simple.js
```

### Step 2: Install Dependencies (Optional)
The orchestrator can work without external dependencies. If you want full functionality:

```bash
cd .kiro
npm install
```

### Step 3: Test Guardian
```bash
# Simple test (no dependencies)
node .kiro/scripts/guardian-simple.js

# Full test (with dependencies)
npm run guardian
```

### Step 4: Test Orchestrator
```bash
node .kiro/scripts/test-orchestrator.js
```

### Step 5: Generate Implementation Plan
```bash
node .kiro/scripts/orchestrate.js
```

## ✅ Installation Verification

Run this command to verify everything is working:

```bash
node .kiro/scripts/guardian-simple.js && echo "✅ Guardian works" && node .kiro/scripts/test-orchestrator.js && echo "✅ Orchestrator works"
```

## 🎯 Available Commands

### Without Dependencies
```bash
node .kiro/scripts/guardian-simple.js      # Basic validation
node .kiro/scripts/orchestrate.js          # Generate plan
node .kiro/scripts/test-orchestrator.js    # Test system
```

### With Dependencies (after npm install)
```bash
npm run guardian                            # Full validation
npm run guardian:quick                      # Quick check
npm run orchestrate                         # Generate plan
npm run implement <spec>                    # Implement feature
```

## 🔧 Git Hooks (Optional)

To install git hooks for automatic validation:

```bash
node .kiro/scripts/install-hooks.js
```

This will run Guardian validation before any commit that modifies `.kiro/` files.

## 📊 System Status

After installation, you should have:

- ✅ Guardian validation working
- ✅ Orchestrator plan generation working
- ✅ Implementation agents ready
- ✅ Boundary protection active
- ✅ Documentation complete

## 🛠️ Troubleshooting

### "node command not found"
- Install Node.js from https://nodejs.org/
- Ensure Node.js is in your PATH

### "Permission denied"
- On Windows: Run PowerShell as Administrator
- On Mac/Linux: Use `chmod +x` on script files

### "Module not found" errors
- Run `cd .kiro && npm install` to install dependencies
- Or use the simple versions that don't require dependencies

### Guardian fails
- Check for missing spec files
- Ensure .kiro/specs/ directory exists
- Look for formatting errors in spec files

### Orchestrator fails
- Check that specs directory has proper structure
- Ensure architecture docs exist if referenced
- Verify permissions on .kiro directory

## 🎉 Success Indicators

When installation is successful, you'll see:

```
✅ Context validated - No conflicts detected
└─ System is ready for orchestration
```

And the orchestrator will show:

```
📋 Found X specs
   - Y already implemented
   - Z need implementation
```

## 📚 Next Steps

1. **Generate implementation plan**: `node .kiro/scripts/orchestrate.js`
2. **Implement first feature**: `npm run implement <feature-name>`
3. **Validate implementation**: `npm run guardian`
4. **Run tests**: `npm test`

---

**Your orchestration system is ready to automate spec-to-code implementation!**