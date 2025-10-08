# JobFinders Guardian System

The **Guardian** is a comprehensive validation system that ensures consistency and prevents conflicts across all `.kiro/` specifications, architecture documents, and implementation files.

## 🛡️ What the Guardian Does

### Conflict Detection & Prevention
- Identifies contradictions between specs, architecture docs, and code reviews
- Flags duplicate or overlapping feature definitions across files
- Detects misaligned API contracts, data models, or system boundaries
- Prevents specs from diverging from actual implementation patterns

### Semantic Consistency Validation
- Ensures terminology is used consistently (e.g., "user" vs "candidate" vs "job seeker")
- Validates that data models align across schema definitions, API specs, and architecture docs
- Checks that feature dependencies are properly documented and non-circular
- Verifies that tech stack choices in architecture match implementation constraints

### Structural Integrity Maintenance
- Enforces spec formatting standards (proper YAML/JSON syntax, valid Prisma schemas)
- Maintains bidirectional links between related docs (specs ↔ architecture ↔ reviews)
- Ensures all referenced files, modules, or components actually exist
- Validates that version numbers and timestamps are consistent

## 🚀 Quick Start

### Installation
```bash
# Install Guardian dependencies
cd .kiro
npm install

# Install git hooks for automatic validation
npm run install-hooks
```

### Basic Usage
```bash
# Run full validation
npm run guardian

# Run quick check (focuses on common issues)
npm run guardian:quick

# Show statistics
node .kiro/bin/guardian stats
```

### Manual Execution
```bash
# From project root
node .kiro/scripts/guardian.js

# Using the CLI wrapper
node .kiro/bin/guardian validate
node .kiro/bin/guardian quick
```

## 📊 Validation Categories

### Data Model Conflicts
- Prisma schema vs API specs vs architecture diagrams
- Mismatched field names, types, or relationships
- Inconsistent entity definitions

### Feature Duplication
- Same functionality defined in multiple specs with different requirements
- Overlapping feature scopes
- Redundant specification documents

### Dependency Violations
- Component A depends on B, but B's spec doesn't expose required interface
- Circular dependencies between features
- Missing prerequisite features

### Tech Stack Mismatches
- Architecture specifies PostgreSQL, but code review mentions MongoDB
- Conflicting technology choices
- Version incompatibilities

### API Contract Drift
- Endpoint definitions in specs don't match actual implementation
- Missing or incorrect HTTP methods
- Inconsistent request/response formats

### Naming Inconsistencies
- Same entity called different names across documents
- Inconsistent terminology usage
- Non-standard naming conventions

### Version Skew
- Outdated specs referencing deprecated patterns
- Misaligned version numbers
- Stale implementation references

## 🔧 Configuration

### Guardian Scripts

- **`guardian.js`** - Main validation engine with comprehensive checks
- **`quick-check.js`** - Fast validation for development (common issues only)
- **`install-hooks.js`** - Sets up git hooks for automatic validation

### Integration Points

The Guardian automatically integrates with:
- **Git pre-commit hooks** - Validates before allowing commits with .kiro changes
- **Project scripts** - Available via npm run commands
- **Development workflow** - Can be run manually or as part of CI/CD

## 📋 Output Format

### When Conflicts Detected
```
⚠️ CONFLICT DETECTED: [Category]
├─ Affected Files: [list of files]
├─ Issue: [description of the problem]
├─ Impact: [which systems/features are affected]
└─ Resolution: [suggested fix]
```

### When Validation Passes
```
✅ Context validated - No conflicts detected
└─ Checked: [N] specs, [M] architecture docs, [K] reviews
```

### Statistics Summary
```
📊 Guardian Statistics:
   Active specs: 12
   Archived specs: 15
   Architecture docs: 3
   Total files: 67
   Last updated: 2025-10-07
```

## 🎯 Best Practices

### Before Making Changes
1. Run `npm run guardian:quick` to check for obvious issues
2. Update relevant specs before implementing features
3. Run full validation before committing

### When Conflicts are Found
1. Review the suggested resolution
2. Update the affected files
3. Re-run validation to confirm fixes
4. Commit changes only after validation passes

### Regular Maintenance
- Run full validation weekly to catch drift
- Archive completed specifications promptly
- Update cross-references when files are moved
- Review warning messages for potential improvements

## 🔄 Integration with Development Workflow

### Pre-commit Validation
The Guardian automatically runs when you try to commit changes to `.kiro/` files:

```bash
git add .kiro/specs/new-feature/requirements.md
git commit -m "Add new feature spec"
# Guardian runs automatically here
```

### CI/CD Integration
Add to your CI pipeline:

```yaml
- name: Run Guardian validation
  run: |
    cd .kiro
    npm install
    npm run guardian
```

### Manual Validation
For critical changes or before releases:

```bash
npm run guardian
```

## 🛠️ Troubleshooting

### Common Issues

**Guardian fails during commit**
- Check the conflict messages
- Fix the identified issues
- Try committing again

**Missing dependencies**
```bash
cd .kiro
npm install
```

**Git hooks not working**
```bash
npm run guardian:install
```

### Getting Help

1. Check the conflict messages for specific guidance
2. Review the suggested resolutions
3. Consult the specification templates in `.kiro/specs/_TEMPLATE/`
4. Ensure all files follow the documented format standards

## 📚 Related Documentation

- [Specification Templates](./specs/_TEMPLATE/) - Standard formats for requirements, design, and tasks
- [Architecture Overview](./architecture/) - System design documents
- [Implementation Plan](./implementation-plan.md) - Master development roadmap
- [Main Project README](../README.md) - Overall project documentation

---

**Mission**: Keep the `.kiro/` folder as the **single source of truth** that developers can trust, preventing the chaos of misaligned implementations, redundant features, and architectural drift.