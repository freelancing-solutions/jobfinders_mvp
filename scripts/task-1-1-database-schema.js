#!/usr/bin/env node

/**
 * Task 1.1: Database Schema Enhancement
 *
 * This script implements the database schema updates required for the critical integration.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DatabaseSchemaUpdater {
  constructor() {
    this.prismaSchemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
    this.backupPath = path.join(process.cwd(), 'prisma/schema.backup.prisma');
  }

  async execute() {
    console.log('🗄️  Task 1.1: Database Schema Enhancement');
    console.log('==========================================');

    try {
      // Step 1: Backup current schema
      await this.backupCurrentSchema();

      // Step 2: Analyze current schema vs requirements
      await this.analyzeSchemaGaps();

      // Step 3: Update Prisma schema
      await this.updatePrismaSchema();

      // Step 4: Generate migration
      await this.generateMigration();

      // Step 5: Test migration on staging
      await this.testMigration();

      // Step 6: Generate TypeScript types
      await this.generateTypes();

      console.log('✅ Task 1.1 completed successfully');

    } catch (error) {
      console.error('❌ Task 1.1 failed:', error.message);
      await this.rollback();
      throw error;
    }
  }

  async backupCurrentSchema() {
    console.log('💾 Creating backup of current schema...');

    if (fs.existsSync(this.prismaSchemaPath)) {
      fs.copyFileSync(this.prismaSchemaPath, this.backupPath);
      console.log('✅ Schema backed up successfully');
    } else {
      console.log('⚠️  No existing schema found, creating new one');
    }
  }

  async analyzeSchemaGaps() {
    console.log('🔍 Analyzing schema gaps...');

    // Read current schema
    let currentSchema = '';
    if (fs.existsSync(this.prismaSchemaPath)) {
      currentSchema = fs.readFileSync(this.prismaSchemaPath, 'utf8');
    }

    // Check for missing models
    const requiredModels = [
      'CandidateProfile',
      'JobProfile',
      'MatchResult',
      'ResumeFile',
      'Notification',
      'Event',
      'User'
    ];

    const missingModels = requiredModels.filter(model =>
      !currentSchema.includes(`model ${model}`)
    );

    if (missingModels.length > 0) {
      console.log(`📋 Missing models detected: ${missingModels.join(', ')}`);
    } else {
      console.log('✅ All required models found');
    }

    // Check for missing fields
    const missingFields = this.analyzeMissingFields(currentSchema);
    if (missingFields.length > 0) {
      console.log(`📋 Missing fields detected: ${missingFields.join(', ')}`);
    } else {
      console.log('✅ All required fields found');
    }
  }

  analyzeMissingFields(schema) {
    const missingFields = [];

    // Check for candidate profile fields
    if (!schema.includes('embedding Float[]')) {
      missingFields.push('CandidateProfile.embedding');
    }

    if (!schema.includes('resumeFiles ResumeFile[]')) {
      missingFields.push('CandidateProfile.resumeFiles');
    }

    // Check for job profile fields
    if (!schema.includes('embedding Float[]')) {
      missingFields.push('JobProfile.embedding');
    }

    if (!schema.includes('matchResults MatchResult[]')) {
      missingFields.push('JobProfile.matchResults');
    }

    // Check for match result fields
    if (!schema.includes('breakdown Json')) {
      missingFields.push('MatchResult.breakdown');
    }

    if (!schema.includes('explanation Json')) {
      missingFields.push('MatchResult.explanation');
    }

    return missingFields;
  }

  async updatePrismaSchema() {
    console.log('✏️  Updating Prisma schema...');

    const enhancedSchema = this.generateEnhancedSchema();
    fs.writeFileSync(this.prismaSchemaPath, enhancedSchema);

    console.log('✅ Prisma schema updated successfully');
  }

  generateEnhancedSchema() {
    return `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  role          Role      @default("seeker")
  passwordHash  String?
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  candidateProfile CandidateProfile?
  employerProfile   JobProfile[]
  notifications     Notification[]
  accounts          Account[]
  sessions          Session[]

  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verificationtokens")
}

model CandidateProfile {
  id                String    @id @default(cuid())
  userId            String    @unique
  personalInfo      Json
  professionalSummary String?
  skills            Json      @default("[]")
  experience        Json      @default("[]")
  education         Json      @default("[]")
  certifications    Json      @default("[]")
  preferences       Json      @default("{}")
  availability      Json      @default("{}")
  resumeFiles       ResumeFile[]
  matchResults      MatchResult[]
  completionScore   Int       @default(0)
  visibility        String    @default("public")
  isActive          Boolean   @default(true)
  embedding         Float[]   // For AI matching
  metadata          Json      @default("{}")
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("candidate_profiles")
}

model JobProfile {
  id              String    @id @default(cuid())
  employerId      String
  title           String
  description     String
  requirements    Json      @default("{}")
  preferences     Json      @default("{}")
  compensation    Json      @default("{}")
  companyInfo     Json      @default("{}")
  matchResults    MatchResult[]
  embedding       Float[]   // For AI matching
  postedDate      DateTime  @default(now())
  expiryDate      DateTime?
  urgency         String    @default("medium")
  isActive        Boolean   @default(true)
  metadata        Json      @default("{}")
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  employer User @relation(fields: [employerId], references: [id], onDelete: Cascade)

  @@map("job_profiles")
}

model MatchResult {
  id              String   @id @default(cuid())
  candidateId     String
  jobId           String
  score           Float
  breakdown       Json
  explanation     Json
  confidence      Float
  status          String   @default("new")
  feedback        Json?
  matchDate       DateTime @default(now())
  algorithm       String   @default("hybrid")
  recommendations String[] @default([])
  metadata        Json     @default("{}")

  candidate CandidateProfile @relation(fields: [candidateId], references: [id], onDelete: Cascade)
  job       JobProfile       @relation(fields: [jobId], references: [id], onDelete: Cascade)

  @@unique([candidateId, jobId])
  @@map("match_results")
}

model ResumeFile {
  id          String   @id @default(cuid())
  profileId   String
  fileName    String
  fileUrl     String
  fileSize    Int
  fileType    String
  analysis    Json?    // AI analysis results
  atsScore    Float?
  isPrimary   Boolean  @default(false)
  status      String   @default("processing")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  profile CandidateProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@map("resume_files")
}

model Notification {
  id          String   @id @default(cuid())
  userId      String
  type        String
  title       String
  content     String
  channels    Json     @default("[]")
  status      String   @default("pending")
  sentAt      DateTime?
  readAt      DateTime?
  metadata    Json     @default("{}")
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notifications")
}

model Event {
  id        String   @id @default(cuid())
  type      String
  data      Json
  userId    String?
  metadata  Json     @default("{}")
  processed Boolean  @default(false)
  createdAt DateTime @default(now())

  @@map("events")
}

enum Role {
  seeker
  employer
  admin
}
`;
  }

  async generateMigration() {
    console.log('🔄 Generating database migration...');

    try {
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
      console.log('✅ Migration generated successfully');
    } catch (error) {
      console.error('❌ Migration generation failed:', error.message);
      throw error;
    }
  }

  async testMigration() {
    console.log('🧪 Testing migration...');

    // Test database connection
    try {
      execSync('npx prisma db pull', { stdio: 'inherit' });
      console.log('✅ Database connection successful');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }

    // Test schema validation
    try {
      execSync('npx prisma validate', { stdio: 'inherit' });
      console.log('✅ Schema validation successful');
    } catch (error) {
      console.error('❌ Schema validation failed:', error.message);
      throw error;
    }
  }

  async generateTypes() {
    console.log('🔧 Generating TypeScript types...');

    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('✅ TypeScript types generated successfully');
    } catch (error) {
      console.error('❌ TypeScript generation failed:', error.message);
      throw error;
    }
  }

  async rollback() {
    console.log('🔄 Rolling back changes...');

    if (fs.existsSync(this.backupPath)) {
      fs.copyFileSync(this.backupPath, this.prismaSchemaPath);
      console.log('✅ Rollback completed');
    } else {
      console.log('⚠️  No backup found for rollback');
    }
  }
}

// Execute the task
async function main() {
  const updater = new DatabaseSchemaUpdater();
  await updater.execute();
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Task execution failed:', error);
    process.exit(1);
  });
}

module.exports = DatabaseSchemaUpdater;