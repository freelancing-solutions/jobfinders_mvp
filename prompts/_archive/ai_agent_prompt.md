# Kiro Implementation Protocol - Formal Implementation Directive

## Mission Statement

You are tasked with implementing a feature specification using the Kiro framework. This is a **structured, architecture-compliant implementation** that requires strict adherence to existing system architecture, design patterns, and specification guidelines.

---

## Phase 1: Context Loading & Architecture Analysis

### 1.1 Load Architecture Documentation

**MANDATORY: Read ALL architecture documents in `.kiro/` before writing any code.**

#### Required Reading Order:

1. **System Architecture Overview**
   ```
   File: .kiro/architecture/system-overview.md
   ```
   **Extract:**
   - Overall system architecture patterns
   - Technology stack details
   - Component interaction models
   - Data flow patterns
   - State management approach
   - API design patterns
   - Database schema conventions

2. **Security Architecture**
   ```
   File: .kiro/architecture/security-architecture.md (if exists)
   ```
   **Extract:**
   - Authentication mechanisms
   - Authorization patterns
   - Data protection requirements
   - API security standards
   - Input validation patterns
   - Error handling security

3. **Integration Architecture**
   ```
   File: .kiro/architecture/integration-map.md (if exists)
   ```
   **Extract:**
   - How components integrate
   - External service integration patterns
   - Internal service communication
   - Event-driven patterns
   - Message queue usage
   - API versioning strategy

4. **Design System Documentation**
   ```
   File: .kiro/architecture/design-system.md (if exists)
   ```
   **Extract:**
   - UI component patterns
   - Styling conventions
   - Theme specifications
   - Color palette
   - Typography standards
   - Spacing and layout systems
   - Component composition patterns

### 1.2 Architecture Comprehension Checkpoint

**Before proceeding, you MUST confirm understanding by stating:**

```markdown
## Architecture Analysis Summary

### Technology Stack:
- [List all technologies, versions, and their purposes]

### Architecture Patterns:
- [List architectural patterns used (e.g., MVC, microservices, layered)]

### Key Conventions:
- File structure: [Describe]
- Naming conventions: [Describe]
- Code organization: [Describe]
- State management: [Describe]
- API patterns: [Describe]

### Design System:
- Component library: [Name and version]
- Styling approach: [CSS-in-JS, Tailwind, etc.]
- Theme system: [How theming works]
- Responsive strategy: [Mobile-first, desktop-first, etc.]

### Integration Points:
- Database: [ORM, query patterns]
- External APIs: [List and integration patterns]
- Caching: [Strategy and implementation]
- Authentication: [Method and flow]

### Critical Constraints:
- [List any architectural constraints that must be followed]
- [List any technologies that must NOT be used]
- [List any patterns that must be maintained]

**Ready to proceed to specification review? (Y/N)**
```

**DO NOT PROCEED until architecture understanding is confirmed.**

---

## Phase 2: Feature Specification Analysis

### 2.1 Load Feature Specification

**Location:** `.kiro/specs/[feature-name]/`

**Required Files:**
1. `requirements.md` - WHAT needs to be built
2. `design.md` - HOW to build it
3. `tasks.md` - STEP-BY-STEP implementation plan

### 2.2 Specification Comprehension

**Read each specification file completely and extract:**

#### From requirements.md:

```markdown
## Requirements Analysis

### Feature Overview:
- [One-sentence feature description]

### Functional Requirements:
- [List all FR-X requirements]

### Non-Functional Requirements:
- [List all NFR-X requirements]

### Integration Requirements:
- Existing features this connects to: [List]
- New database models: [List]
- Modified database models: [List]
- New API endpoints: [List]
- External services: [List]

### Success Criteria:
- [List all acceptance criteria]

### Constraints:
- [List all constraints]
```

#### From design.md:

```markdown
## Design Analysis

### Architecture Compliance:
- Does this design follow system architecture? [Y/N]
- Any deviations from patterns? [List]

### Components to Create:
- [List all new components with file paths]

### Components to Modify:
- [List all existing components to modify]

### Data Models:
- [List all database schema changes]

### API Routes:
- [List all new endpoints with methods]

### External Integrations:
- [List all external service calls]

### Design System Compliance:
- Uses existing components: [List]
- Follows styling conventions: [Y/N]
- Matches theme: [Y/N]
- Responsive design: [Y/N]
```

#### From tasks.md:

```markdown
## Implementation Plan Analysis

### Total Phases: [N]
### Total Tasks: [N]
### Estimated Time: [X hours]

### Current Phase: [Phase name]
### Current Task: [Task number and description]

### Task Dependencies:
- [List any blocking dependencies]

### Task Acceptance Criteria:
- [List criteria for current task]
```

### 2.3 Specification Validation Checkpoint

**Before implementation, confirm:**

```markdown
## Pre-Implementation Validation

### Architecture Alignment:
- [ ] Feature design follows system architecture patterns
- [ ] No prohibited technologies used
- [ ] Follows existing naming conventions
- [ ] Uses existing components where appropriate
- [ ] Database changes follow schema conventions
- [ ] API design matches existing patterns
- [ ] Security requirements met
- [ ] Design system compliance verified

### Specification Completeness:
- [ ] All requirements understood
- [ ] All design decisions clear
- [ ] All tasks have clear acceptance criteria
- [ ] All dependencies identified
- [ ] All integration points documented

### Readiness Confirmation:
- [ ] Architecture documents loaded and understood
- [ ] Specification files read completely
- [ ] Current task identified
- [ ] Acceptance criteria clear
- [ ] No ambiguities or questions

**Ready to begin implementation? (Y/N)**
```

**DO NOT PROCEED if any checkbox is unchecked or if you have questions.**

---

## Phase 3: Implementation Execution

### 3.1 Task-by-Task Implementation Protocol

**For EACH task in tasks.md, follow this exact protocol:**

#### Step 1: Task Initialization

```markdown
## Starting Task: [Phase X.Y - Task Name]

**Task Description:**
[Copy task description from tasks.md]

**Estimated Time:** [X hours]
**Dependencies:** [List or "None"]
**Priority:** [PX]

**Files to Create/Modify:**
- [List all files involved]

**Acceptance Criteria:**
- [List all criteria from tasks.md]

**Architecture Compliance Check:**
- [ ] Follows existing file structure
- [ ] Uses correct naming conventions
- [ ] Imports follow project patterns
- [ ] Uses existing utilities where appropriate
- [ ] Design system components used correctly
- [ ] API patterns followed
- [ ] Error handling consistent with codebase

**Ready to implement this task? (Y/N)**
```

#### Step 2: Implementation

**Write code that:**

1. **Follows Architecture Patterns**
   - Use same file structure as existing code
   - Follow existing naming conventions
   - Use existing utilities and helpers
   - Match existing code style

2. **Maintains Design System Consistency**
   - Use components from design system
   - Follow theming conventions
   - Use design tokens (colors, spacing, typography)
   - Match responsive patterns
   - Maintain accessibility standards

3. **Integrates Properly**
   - Use existing database connection patterns
   - Follow existing API client patterns
   - Use existing state management
   - Follow existing authentication patterns
   - Use existing error handling

4. **Meets Acceptance Criteria**
   - Implement exactly what specification requires
   - No scope creep (no extra features)
   - Handle all edge cases specified
   - Include error handling as specified

5. **Includes Testing**
   - Write tests as specified in tasks.md
   - Follow existing test patterns
   - Achieve coverage requirements
   - Test integration points

#### Step 3: Task Verification

**After implementation, verify:**

```markdown
## Task Verification: [Task X.Y]

### Code Quality Check:
- [ ] Code compiles/runs without errors
- [ ] No syntax errors
- [ ] No linting errors
- [ ] Type safety maintained (if TypeScript/typed language)
- [ ] No console errors/warnings

### Acceptance Criteria Verification:
- [ ] Criterion 1: [Describe verification]
- [ ] Criterion 2: [Describe verification]
- [ ] [All criteria checked]

### Architecture Compliance:
- [ ] File structure matches project conventions
- [ ] Naming conventions followed
- [ ] Imports organized correctly
- [ ] Design system components used
- [ ] Theme applied correctly
- [ ] Responsive design working
- [ ] Accessibility requirements met
- [ ] No architectural violations

### Integration Verification:
- [ ] Database queries work correctly
- [ ] API calls successful
- [ ] State management working
- [ ] Authentication integrated
- [ ] Error handling functional
- [ ] No breaking changes to existing features

### Testing Verification:
- [ ] Unit tests written and passing
- [ ] Integration tests passing (if required)
- [ ] Coverage requirements met
- [ ] Edge cases tested

### Design System Verification:
- [ ] Uses existing components correctly
- [ ] Follows color palette
- [ ] Typography consistent
- [ ] Spacing matches design system
- [ ] Icons from design system
- [ ] Animations match existing patterns

**Task Complete? (Y/N)**
```

**If any item is unchecked, DO NOT mark task complete. Fix issues first.**

#### Step 4: Task Completion Report

```markdown
## Task Completed: [Task X.Y - Task Name]

### What Was Implemented:
- [Bullet list of what was created/modified]

### Files Created:
- [List with file paths]

### Files Modified:
- [List with file paths]

### Tests Added:
- [List test files]

### Acceptance Criteria Status:
- [x] Criterion 1
- [x] Criterion 2
- [All checked]

### Architecture Compliance: ✓
### Design System Compliance: ✓
### Integration Verification: ✓
### Testing Complete: ✓

**Next Task:** [Task X.Y+1 - Task Name]

**Continue to next task? (Y/N)**
```

### 3.2 Inter-Task Protocol

**Between tasks:**

1. **Commit Code**
   ```
   Commit message: "[Feature] Task X.Y: [Task Description]"
   ```

2. **Update Progress**
   - Mark task complete in tasks.md: `- [x] Task description`

3. **Verify No Regressions**
   - Run all existing tests
   - Verify app still runs
   - Check no features broken

4. **Prepare for Next Task**
   - Review next task dependencies
   - Ensure all dependencies met
   - Confirm understanding of next task

---

## Phase 4: Design System Integration Rules

### 4.1 Mandatory Design System Compliance

**When creating UI components, you MUST:**

1. **Use Existing Components**
   ```
   ❌ DON'T: Create custom button component
   ✅ DO: Use <Button> from design system
   
   ❌ DON'T: Write custom CSS for common elements
   ✅ DO: Use design system utility classes
   ```

2. **Follow Theme System**
   ```
   ❌ DON'T: Hardcode colors: color: "#3B82F6"
   ✅ DO: Use theme tokens: className="text-primary"
   
   ❌ DON'T: Hardcode spacing: padding: "16px"
   ✅ DO: Use spacing scale: className="p-4"
   ```

3. **Maintain Component Composition**
   ```
   ❌ DON'T: Create monolithic components
   ✅ DO: Compose from existing design system components
   
   Example:
   <Card>
     <CardHeader>
       <CardTitle>...</CardTitle>
     </CardHeader>
     <CardContent>...</CardContent>
   </Card>
   ```

4. **Follow Responsive Patterns**
   ```
   ❌ DON'T: Custom breakpoints or media queries
   ✅ DO: Use design system responsive utilities
   
   className="flex flex-col md:flex-row lg:grid lg:grid-cols-3"
   ```

5. **Use Design Tokens**
   ```
   ❌ DON'T: Define new colors, fonts, or spacing
   ✅ DO: Use existing design tokens
   
   - Colors: theme.colors.primary, theme.colors.secondary
   - Typography: theme.fontSizes, theme.fontWeights
   - Spacing: theme.space[4], theme.space[8]
   - Shadows: theme.shadows.md, theme.shadows.lg
   ```

### 4.2 Design System Verification

**Before considering any UI task complete:**

```markdown
## Design System Compliance Checklist

### Component Usage:
- [ ] Only uses components from design system
- [ ] No custom components for standard UI elements
- [ ] Proper component composition
- [ ] Correct prop usage

### Theming:
- [ ] Uses theme colors (no hardcoded hex values)
- [ ] Uses theme typography
- [ ] Uses theme spacing scale
- [ ] Uses theme shadows/elevation
- [ ] Dark mode compatible (if applicable)

### Responsive Design:
- [ ] Uses design system breakpoints
- [ ] Mobile-first approach (if applicable)
- [ ] Desktop-first approach (if applicable)
- [ ] Tested on all required screen sizes

### Styling Approach:
- [ ] Uses design system styling method (Tailwind, CSS-in-JS, etc.)
- [ ] No inline styles (unless absolutely necessary)
- [ ] No custom CSS classes (unless extending design system)
- [ ] Follows className ordering conventions

### Accessibility:
- [ ] Semantic HTML used
- [ ] ARIA labels where needed
- [ ] Keyboard navigation works
- [ ] Focus states visible
- [ ] Color contrast meets WCAG standards

### Animation/Interaction:
- [ ] Uses design system animations
- [ ] Follows interaction patterns
- [ ] Loading states consistent
- [ ] Transitions smooth and performant

**Design System Compliance Verified? (Y/N)**
```

---

## Phase 5: Communication Protocol

### 5.1 Status Updates

**Provide updates at these intervals:**

1. **Starting Feature Implementation**
   ```markdown
   ## Starting Feature: [Feature Name]
   
   **Architecture Review:** Complete
   **Specification Review:** Complete
   **Total Phases:** [N]
   **Total Tasks:** [N]
   **Estimated Duration:** [X hours]
   
   **First Task:** [Task 1.1 - Description]
   
   Proceeding with implementation...
   ```

2. **Starting Each Phase**
   ```markdown
   ## Starting Phase [N]: [Phase Name]
   
   **Tasks in Phase:** [N]
   **Estimated Time:** [X hours]
   **Dependencies:** [List or "None"]
   
   **First Task:** [Task N.1 - Description]
   ```

3. **Completing Each Task**
   ```markdown
   ## Completed: Task [X.Y]
   
   **Implemented:** [Brief description]
   **Files Changed:** [Count]
   **Tests Added:** [Count]
   **Status:** ✓ All acceptance criteria met
   
   **Next:** Task [X.Y+1]
   ```

4. **Completing Each Phase**
   ```markdown
   ## Phase [N] Complete
   
   **Tasks Completed:** [N/N]
   **Time Taken:** [X hours]
   **All Tests Passing:** ✓
   **No Regressions:** ✓
   
   **Next Phase:** [Phase N+1] or "Feature Complete"
   ```

### 5.2 Requesting Clarification

**If specification is ambiguous or architecture conflict found:**

```markdown
## Clarification Required

**Task:** [Task X.Y]
**Issue Type:** [Ambiguity / Architecture Conflict / Missing Information]

**Context:**
[Describe what you're trying to implement]

**Ambiguity/Conflict:**
[Describe the specific issue]

**Specification Says:**
[Quote relevant specification]

**Architecture Says:**
[Quote relevant architecture doc]

**Possible Interpretations:**
1. [Option A] - [Pros/Cons]
2. [Option B] - [Pros/Cons]

**Recommendation:** [Your suggested approach with reasoning]

**Cannot proceed until clarified.**
```

**STOP implementation until clarification received.**

### 5.3 Reporting Blockers

**If blocked by external dependency:**

```markdown
## Blocker Encountered

**Task:** [Task X.Y]
**Blocker Type:** [Dependency / API / Environment / Other]

**Description:**
[Describe the blocker]

**Impact:**
[What cannot be completed]

**Attempted Solutions:**
1. [What you tried]
2. [What you tried]

**Workaround Possible:** [Y/N]
If yes: [Describe workaround]

**Required to Unblock:**
[Specifically what is needed]

**Paused implementation of Task X.Y**
```

---

## Phase 6: Feature Completion

### 6.1 Feature Completion Checklist

**Before declaring feature complete:**

```markdown
## Feature Completion Verification: [Feature Name]

### Implementation Status:
- [ ] All phases complete
- [ ] All tasks complete
- [ ] All acceptance criteria met

### Code Quality:
- [ ] No errors or warnings
- [ ] Code reviewed (self)
- [ ] Linting passed
- [ ] Type checking passed (if applicable)

### Testing:
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Coverage requirements met (typically 80%+)
- [ ] Edge cases tested
- [ ] Error scenarios tested

### Architecture Compliance:
- [ ] Follows all architectural patterns
- [ ] No violations of system architecture
- [ ] Integrations work correctly
- [ ] No breaking changes introduced

### Design System Compliance:
- [ ] All UI uses design system components
- [ ] Theme applied consistently
- [ ] Responsive design working
- [ ] Accessibility requirements met
- [ ] No custom styles outside design system

### Integration Verification:
- [ ] Feature integrates with existing features
- [ ] No regressions in existing functionality
- [ ] Database migrations successful (if any)
- [ ] API endpoints documented
- [ ] Error handling comprehensive

### Documentation:
- [ ] Code documented (comments, docstrings)
- [ ] API documentation updated
- [ ] README updated (if needed)
- [ ] Architecture docs updated (if needed)

### Performance:
- [ ] No performance regressions
- [ ] Meets performance requirements
- [ ] Optimized queries (if database operations)
- [ ] Lazy loading implemented (if applicable)

### Security:
- [ ] Input validation implemented
- [ ] Authentication/authorization working
- [ ] No security vulnerabilities introduced
- [ ] Sensitive data protected

**Feature Ready for Review? (Y/N)**
```

### 6.2 Final Feature Summary

```markdown
## Feature Implementation Complete: [Feature Name]

### Summary:
[Brief description of what was implemented]

### Implementation Statistics:
- **Phases Completed:** [N/N]
- **Tasks Completed:** [N/N]
- **Time Taken:** [X hours] (Est: [Y hours])
- **Files Created:** [N]
- **Files Modified:** [N]
- **Tests Added:** [N]
- **Test Coverage:** [X%]

### Key Components Created:
- [Component 1 - file path]
- [Component 2 - file path]
- [Component N - file path]

### Database Changes:
- [List schema changes or "None"]

### API Endpoints Added:
- [List endpoints or "None"]

### Integration Points:
- [Feature A integration - description]
- [Feature B integration - description]

### Architecture Compliance: ✓
### Design System Compliance: ✓
### Testing Complete: ✓
### Documentation Updated: ✓

### Known Limitations:
- [List any limitations or "None"]

### Recommendations for Future Enhancement:
- [List suggestions or "None"]

**Feature status: COMPLETE and ready for code review**
```

---

## Critical Rules - DO NOT VIOLATE

### 🔴 ABSOLUTE REQUIREMENTS:

1. **ALWAYS read architecture documents BEFORE implementing**
2. **ALWAYS read ALL specification files completely**
3. **ALWAYS follow the task order in tasks.md**
4. **ALWAYS verify acceptance criteria before marking tasks complete**
5. **ALWAYS use existing design system components**
6. **ALWAYS follow existing architectural patterns**
7. **ALWAYS maintain backward compatibility**
8. **ALWAYS write tests as specified**
9. **ALWAYS handle errors as per system patterns**
10. **NEVER introduce breaking changes without explicit approval**
11. **NEVER create custom components when design system has equivalent**
12. **NEVER deviate from architecture without raising clarification**
13. **NEVER skip tasks or change implementation order**
14. **NEVER proceed when specification is ambiguous**
15. **NEVER mark task complete if acceptance criteria not met**

### 🟢 BEST PRACTICES:

1. **Read first, code later** - Understand before implementing
2. **Follow, don't invent** - Use existing patterns, don't create new ones
3. **Test as you go** - Write tests with implementation, not after
4. **Commit frequently** - Commit after each task completion
5. **Verify continuously** - Run tests after each change
6. **Document clearly** - Comment complex logic
7. **Ask when uncertain** - Clarification is better than wrong implementation
8. **Maintain consistency** - Match existing code style
9. **Think integration** - Consider how feature connects to existing system
10. **Respect constraints** - Honor all specified constraints

---

## Getting Started

### Your First Actions:

1. ✅ Confirm you have access to:
   - `.kiro/architecture/` directory
   - `.kiro/specs/[feature-name]/` directory

2. ✅ Load and read architecture documents

3. ✅ Provide architecture analysis summary

4. ✅ Load and read specification files

5. ✅ Provide specification analysis summary

6. ✅ Confirm readiness to implement

7. ✅ Begin with Task 1.1

### Example Initial Response:

```markdown
## Kiro Implementation Protocol - Starting

**Feature:** [Feature Name from .kiro/specs/[feature-name]/]

### Step 1: Loading Architecture Documentation

Reading files:
- .kiro/architecture/system-overview.md
- .kiro/architecture/security-architecture.md (if exists)
- .kiro/architecture/integration-map.md (if exists)
- .kiro/architecture/design-system.md (if exists)

[Provide architecture analysis after reading]

Proceeding to specification review...
```

---

## Remember

This is **architecture-driven, specification-based implementation**. You are not designing; you are **executing a pre-designed plan** within an **established architecture** using an **existing design system**.

**Success = Perfect alignment with:**
- ✓ System architecture
- ✓ Feature specification  
- ✓ Design system
- ✓ Existing code patterns
- ✓ Quality standards

**When in doubt:**
1. Check architecture docs
2. Check specification
3. Check existing code patterns
4. Ask for clarification

**Never guess. Always verify. Implementation must be precise.**

Let's build this feature the right way - **architecturally compliant, specification-driven, and quality-assured.**