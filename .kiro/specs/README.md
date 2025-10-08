# Job Finders MVP - Specifications Directory

## Overview

This directory contains all technical specifications for the Job Finders MVP platform. Specifications follow a structured lifecycle from draft through active implementation to archival.

### Specification Lifecycle
1. **Draft** - Initial requirements gathering and design exploration
2. **Active** - Currently being implemented or referenced for development
3. **Implemented** - Fully implemented and moved to archive
4. **Archived** - Superseded, deprecated, or completed specifications

## Specification Index

| Spec Name | Status | Priority | Category | Implementation | Last Updated | Related Specs |
|---|---|---|---|---|---|---|
| **Core Platform Features** | | | | | | |
| applications-management | Active | High | Core Features | Partial | 2024-01-15 | critical-integration-issues |
| jobs-listing | Active | Critical | Core Features | Partial (APIs ready) | 2024-01-15 | saved-jobs |
| saved-jobs | Active | High | Core Features | Partial (APIs ready) | 2024-01-15 | jobs-listing |
| candidate-matching-system | Active | High | Core Features | Extensive | 2024-01-15 | ats-system-development |
| **AI & Advanced Features** | | | | | | |
| ai-agents | Active | Medium | AI/ML | Service exists | 2024-01-15 | candidate-matching-system |
| ats-system-development | Active | Medium | AI/ML | Service exists | 2024-01-15 | candidate-matching-system |
| **Resume System** | | | | | | |
| resume-builder-integration | Active | High | Core Features | Services exist | 2024-01-15 | resume-builder-templates |
| resume-builder-templates | Active | Medium | Core Features | Extensive | 2024-01-15 | resume-builder-integration |
| resume-builder-ui | Active | Medium | UI/UX | Partial | 2024-01-15 | resume-builder-integration |
| **Infrastructure** | | | | | | |
| message-queue-system | Active | Medium | Infrastructure | Not Started | 2024-01-15 | notification-system-unified |
| **User Experience** | | | | | | |
| design-system | Active | Medium | UI/UX | Foundation exists | 2024-01-15 | All UI specs |
| critical-integration-issues | Active | Critical | Integration | Not Started | 2024-01-15 | All active specs |
| **Unified Systems** | | | | | | |
| notification-system-unified | Active | High | Infrastructure | Extensive | 2024-01-15 | Consolidated from 15+ notification specs |
| notification-analytics-unified | Active | Medium | Infrastructure | Not Started | 2024-01-15 | Part of notification-system-unified |

## Implementation Status Summary

### ✅ Fully Implemented (Available in Archive)
- **Notification System** - Complete multi-channel notification platform (consolidated from 15+ individual specs)
- **Template Engine** - Advanced resume template system with AI optimization
- **Matching System** - ML-powered candidate-job matching

### 🔄 In Progress / Partially Implemented
- **Applications Management** - Database models complete, UI partially implemented
- **Jobs Listing** - APIs ready, UI implementation pending
- **Saved Jobs** - APIs ready, UI implementation pending
- **Resume Builder Integration** - Services complete, UI integration pending

### 📋 Not Started
- **Critical Integration Issues** - High priority integration work
- **Message Queue System** - Infrastructure component
- **AI Agents Chat Interface** - Service exists, UI pending

## Standard Template Reference

All specifications should follow the standard three-file structure:

- **`requirements.md`** - Functional and non-functional requirements
- **`design.md`** - Technical design and architecture
- **`tasks.md`** - Implementation tasks and acceptance criteria

Templates are available in the [`_TEMPLATE/`](./_TEMPLATE/) directory.

## Naming Conventions

- Use kebab-case for folder names (e.g., `resume-builder-integration`)
- Use descriptive names that reflect the feature domain
- Avoid version suffixes in folder names (use git for versioning)
- Keep names concise but meaningful

## Requirement Numbering Standard

- **Functional Requirements**: REQ-001 to REQ-499
- **Non-Functional Requirements**: REQ-500 to REQ-699
- **Integration Requirements**: REQ-700 to REQ-799
- **Compliance Requirements**: REQ-800 to REQ-899

## Maintenance Guidelines

### Creating New Specifications
1. Copy the appropriate template from [`_TEMPLATE/`](./_TEMPLATE/)
2. Follow the naming conventions
3. Use standard requirement numbering
4. Update this README index

### Updating Specifications
1. Maintain requirement numbering consistency
2. Update implementation status in index
3. Mark completed tasks in tasks.md
4. Consider archiving when fully implemented

### Archiving Specifications
1. Move entire folder to [`_archive/`](./_archive/) directory
2. Create ARCHIVE_REASON.md file explaining the archive decision
3. Update this README to reflect the change
4. Update any cross-references in other specs

### Review Process
- Quarterly review of all active specifications
- Update implementation status based on current development
- Archive completed or superseded specifications
- Ensure all specifications follow current templates

## Archive Directory

Archived specifications are stored in the [`_archive/`](./_archive/) directory. Each archived spec includes an `ARCHIVE_REASON.md` file explaining why it was archived and where to find current information.

## Related Documentation

- [`../implementation-plan.md`](../implementation-plan.md) - Master implementation plan
- [`../REFACTORING-SUMMARY.md`](./REFACTORING-SUMMARY.md) - Recent refactoring changes
- [`prisma/schema.prisma`](../../prisma/schema.prisma) - Database implementation reference

## Last Updated

2025-10-07 - Major refactoring completed, consolidated notification specs, standardized format