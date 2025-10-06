# -----------------------------
# Spec Work Template
# -----------------------------

# 1. Load Global Architecture Context
- Load all files from `.kiro/architecture/` as system context.
- Use this to understand modules, services, dependencies, and interactions across the repo.

# 2. Load Active Spec
- Load `<ACTIVE_SPEC_PATH>` as the active working spec.
- Focus all reasoning, outputs, and edits on this spec.

# 3. Load Spec Templates
- Load `.kiro/prompts/templates/` for formatting and metadata conventions.
- Follow templates strictly for consistency in documentation, fields, and annotations.

# 4. Load Parallel Spec for Awareness
- Load `<PARALLEL_SPEC_PATH>` for awareness only.
- Do not merge content into the active spec.
- Keep awareness of:
  - Potential overlaps
  - Shared assumptions
  - Integration points
- Acknowledge it is being implemented by another agent in parallel.

# 5. Dependency Awareness
- While working on features in the active spec:
  - Identify any dependencies on features in the parallel spec.
  - Check if the dependent feature is marked `implemented` in the parallel spec.
  - If **not implemented**, pause work on integration points.
  - If **implemented**, reference the actual feature and continue integration.
  
# 6. Reasoning Instructions
- Focus primarily on the active spec’s requirements.
- Reference the parallel spec only for context, awareness, and dependency tracking.
- Maintain awareness that parallel development may affect timelines and integration points.
- Log notes or warnings about dependencies and pending integrations for tracking.

# -----------------------------
# Usage Example
# -----------------------------
# ACTIVE_SPEC_PATH = `.kiro/specs/resume-builder-integration`
# PARALLEL_SPEC_PATH = `.kiro/specs/candidate-matching-system`
