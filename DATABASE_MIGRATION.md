# Database Migration Instructions

## Overview
This document provides instructions for migrating the database schema to support the new Application Management System features.

## New Models Added
- **ApplicationTimeline**: Tracks timeline events for applications
- **ApplicationAttachment**: Manages file attachments for applications
- **ApplicationNote**: Stores notes and comments on applications
- **InterviewSchedule**: Manages interview scheduling and details

## Updated Models
- **JobApplication**: Enhanced with additional fields and relationships

## Migration Steps

### 1. Generate Prisma Client
```bash
npx prisma generate
```

### 2. Create Migration
```bash
npx prisma migrate dev --name "add-application-management-models"
```

### 3. Apply Migration to Database
```bash
npx prisma migrate deploy
```

### 4. Verify Migration
```bash
npx prisma db push
```

## New Features Enabled

### 1. Application Timeline
- Track every status change with timestamps
- Store notes for each timeline event
- Support for different user roles (candidate, employer, system)

### 2. File Attachments
- Upload resumes, cover letters, and other documents
- Track file metadata (size, type, upload date)
- Support for file descriptions and organization

### 3. Application Notes
- Private and public notes for each application
- Tagging system for better organization
- Track who created each note and when

### 4. Interview Scheduling
- Schedule different types of interviews
- Store interview details (location, duration, interviewers)
- Track interview status and feedback

## Indexes Added
- Application status filtering
- Date-based queries
- User-specific application queries
- Performance optimization for common queries

## Testing
After migration, you can test the new features:

1. Create a new application
2. Add notes and attachments
3. Update application status
4. Schedule interviews
5. View the application timeline

## Rollback
If needed, you can rollback the migration:
```bash
npx prisma migrate reset
```

## Troubleshooting
If you encounter issues:
1. Ensure your database is backed up
2. Check that all environment variables are set correctly
3. Verify database permissions
4. Check Prisma schema for any syntax errors

## Next Steps
After successful migration:
1. Test all application management features
2. Verify real-time updates work correctly
3. Check WebSocket functionality
4. Run integration tests
5. Update documentation if needed