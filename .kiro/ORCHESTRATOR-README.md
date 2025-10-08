# Implementation Orchestrator System

The **Orchestrator** automates the workflow from specifications to working code, coordinating between Guardian validation and implementation agents.

## 🎯 What It Does

The Orchestrator system provides:
- **Spec Analysis** - Identifies which specs need implementation
- **Priority Planning** - Orders implementation by dependencies and priority
- **Automated Workflow** - Generates exact commands for implementation
- **Boundary Enforcement** - Prevents agents from modifying system files
- **Validation Integration** - Ensures Guardian validation at each step

## 🚀 Quick Start

### 1. Generate Implementation Plan
```bash
npm run orchestrate
```
This analyzes all specs and generates a step-by-step implementation plan.

### 2. Implement a Single Feature
```bash
npm run implement saved-jobs
```
This implements one spec from start to finish.

### 3. Manual Orchestration
Follow the generated plan step by step for maximum control.

## 📋 How It Works

### Three-Agent System

```
┌─────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR                         │
│  (Analyzes specs, creates plan, coordinates workflow)   │
└─────────────────────────────────────────────────────────┘
           │                                    │
           ↓                                    ↓
    ┌────────────┐                      ┌──────────────┐
    │  GUARDIAN  │                      │ IMPLEMENTER  │
    │ (Validate) │                      │ (Implement)  │
    └────────────┘                      └──────────────┘
```

### Workflow Steps

1. **Analysis Phase**
   - Read all specs (excluding archives)
   - Check existing implementations
   - Determine priority and dependencies
   - Create implementation plan

2. **Guardian Validation**
   - Validate spec consistency
   - Check for conflicts
   - Ensure system integrity

3. **Implementation Phase**
   - Spawn implementation agents with clear boundaries
   - Follow spec-defined file structures
   - Write comprehensive tests
   - Create code reviews

4. **Verification Phase**
   - Post-implementation Guardian validation
   - Test execution
   - Final system integrity check

## 🛡️ Boundary Protection

Each agent has strict boundaries:

### Orchestrator
- ✅ **Read**: `.kiro/specs/`, `.kiro/architecture/`
- ✅ **Write**: Commands and plans only
- ❌ **Never**: Modifies any files directly

### Guardian
- ✅ **Read**: All `.kiro/` files
- ✅ **Write**: Validation reports
- ❌ **Never**: Modifies specs or code

### Implementation Agent
- ✅ **Read**: Assigned spec, architecture docs
- ✅ **Write**: `src/`, `tests/`, `.kiro/_CodeReviews/`
- ❌ **Never**: `.kiro/prompts/`, `.kiro/scripts/`, specs

## 📊 Output Examples

### Implementation Plan
```
📋 Specs Needing Implementation:
1. saved-jobs (Priority: High, Dependencies: None)
2. dashboard-user-details-fix (Priority: Medium, Dependencies: None)
3. resume-builder-ui (Priority: Medium, Dependencies: resume-builder-integration)

STEP 1: Validate Specifications
Run: node .kiro/scripts/guardian.js

STEP 2: Implement saved-jobs
Run: claude-code --prompt "..." --files "..."
```

### Implementation Results
```
✅ IMPLEMENTATION COMPLETE: saved-jobs

📁 Files Created:
- src/app/api/saved-jobs/route.ts
- src/components/jobs/saved-jobs-list.tsx
- tests/saved-jobs.test.ts
- See .kiro/_CodeReviews/saved-jobs-20250107.md for complete file list

🔑 Key Decisions:
- Used Next.js API routes for backend
- Implemented optimistic updates for UI
- Followed existing component patterns

✅ Tests Written:
- API endpoint tests
- Component integration tests
- Coverage: 95%
```

## 🔧 Available Commands

### From Project Root
```bash
# Generate implementation plan
npm run orchestrate

# Implement single feature
npm run implement <spec-folder>

# Guardian validation
npm run guardian

# Quick validation
npm run guardian:quick
```

### Using Scripts Directly
```bash
# Generate plan
node .kiro/scripts/orchestrate.js

# Implement feature
node .kiro/scripts/auto-implement.js saved-jobs

# Validate
node .kiro/scripts/guardian.js
```

## 🎯 Best Practices

### Before Implementation
1. Run `npm run orchestrate` to get the plan
2. Review priority order and dependencies
3. Run Guardian validation first

### During Implementation
1. Implement one feature at a time
2. Run Guardian after each implementation
3. Review code reviews for file locations

### After Implementation
1. Run full test suite
2. Run final Guardian validation
3. Update project documentation

## 📋 File Structure

```
.kiro/
├── prompts/
│   ├── orchestrator.md          # Orchestrator system prompt
│   ├── implementation-agent.md  # Implementation agent prompt
│   └── guardian.md             # Guardian system prompt
├── scripts/
│   ├── orchestrate.js          # Generate implementation plan
│   ├── auto-implement.js       # Automated implementation
│   └── guardian.js             # Guardian validation
├── _CodeReviews/               # Implementation reviews
└── specs/                      # Feature specifications
```

## ⚠️ Important Notes

### Boundary Violation Prevention
Each agent includes boundary detection that prevents unauthorized file modifications:
```
⚠️ BOUNDARY VIOLATION PREVENTED: Attempted to modify .kiro/prompts/guardian.md
This is outside my scope.
```

### Spec-Driven Structure
The implementation agent follows the structure defined in each spec:
- If spec says "place in src/modules/auth/" → Files go there
- If spec doesn't specify structure → Follow existing patterns
- **Never impose predetermined structure**

### Sequential Execution
Features are implemented sequentially to ensure:
- Dependencies are satisfied
- Guardian validation at each step
- Early detection of integration issues

## 🔄 Integration with CI/CD

Add to your CI pipeline:
```yaml
- name: Validate specifications
  run: npm run guardian

- name: Check implementations
  run: npm run orchestrate
  # Fail if new specs need implementation
```

## 🛠️ Troubleshooting

### Implementation Fails
1. Check Guardian output for conflicts
2. Review spec requirements
3. Ensure dependencies are implemented first

### Guardian Conflicts
1. Fix reported conflicts
2. Re-run validation
3. Only proceed when Guardian passes

### Boundary Violations
1. Review agent boundaries
2. Stay within assigned scope
3. Use the correct agent for each task

---

**The Orchestrator ensures consistent, conflict-free implementation from specs to working code!**