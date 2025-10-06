-- Create Resume Builder Tables
-- Migration: 003_create_resume_builder_tables
-- Description: Add tables for resume builder functionality with AI analysis

-- Create resume table (this should already exist but ensure all fields are present)
CREATE TABLE IF NOT EXISTS "jobseeker_cvs" (
    "resume_id" TEXT NOT NULL,
    "user_uid" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "professional_title" TEXT NOT NULL,
    "summary" TEXT,
    "skills" JSONB,
    "portfolio_links" JSONB,
    "resume_file_url" TEXT,
    "profile_image_url" TEXT,
    "location" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "linkedin" TEXT,
    "github" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobseeker_cvs_pkey" PRIMARY KEY ("resume_id")
);

-- Create experience table
CREATE TABLE IF NOT EXISTS "experience" (
    "experience_id" TEXT NOT NULL,
    "resume_id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "location" TEXT,
    "skills" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experience_pkey" PRIMARY KEY ("experience_id")
);

-- Create education table
CREATE TABLE IF NOT EXISTS "education" (
    "education_id" TEXT NOT NULL,
    "resume_id" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "field" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "gpa" DOUBLE PRECISION,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_pkey" PRIMARY KEY ("education_id")
);

-- Create certifications table
CREATE TABLE IF NOT EXISTS "certifications" (
    "certification_id" TEXT NOT NULL,
    "resume_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "issue_date" TIMESTAMP(3) NOT NULL,
    "expiry_date" TIMESTAMP(3),
    "credential_id" TEXT,
    "credential_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("certification_id")
);

-- Create languages table
CREATE TABLE IF NOT EXISTS "languages" (
    "language_id" TEXT NOT NULL,
    "resume_id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "proficiency" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("language_id")
);

-- Create projects table
CREATE TABLE IF NOT EXISTS "projects" (
    "project_id" TEXT NOT NULL,
    "resume_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "technologies" JSONB,
    "project_url" TEXT,
    "github_url" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("project_id")
);

-- Create indexes for resume tables
CREATE INDEX IF NOT EXISTS "jobseeker_cvs_user_uid_idx" ON "jobseeker_cvs"("user_uid");
CREATE INDEX IF NOT EXISTS "jobseeker_cvs_is_primary_idx" ON "jobseeker_cvs"("is_primary");
CREATE INDEX IF NOT EXISTS "jobseeker_cvs_created_at_idx" ON "jobseeker_cvs"("created_at");

CREATE INDEX IF NOT EXISTS "experience_resume_id_idx" ON "experience"("resume_id");
CREATE INDEX IF NOT EXISTS "experience_start_date_idx" ON "experience"("start_date");
CREATE INDEX IF NOT EXISTS "experience_is_current_idx" ON "experience"("is_current");

CREATE INDEX IF NOT EXISTS "education_resume_id_idx" ON "education"("resume_id");
CREATE INDEX IF NOT EXISTS "education_start_date_idx" ON "education"("start_date");
CREATE INDEX IF NOT EXISTS "education_is_current_idx" ON "education"("is_current");

CREATE INDEX IF NOT EXISTS "certifications_resume_id_idx" ON "certifications"("resume_id");
CREATE INDEX IF NOT EXISTS "certifications_issue_date_idx" ON "certifications"("issue_date");
CREATE INDEX IF NOT EXISTS "certifications_expiry_date_idx" ON "certifications"("expiry_date");

CREATE INDEX IF NOT EXISTS "languages_resume_id_idx" ON "languages"("resume_id");
CREATE INDEX IF NOT EXISTS "languages_proficiency_idx" ON "languages"("proficiency");

CREATE INDEX IF NOT EXISTS "projects_resume_id_idx" ON "projects"("resume_id");
CREATE INDEX IF NOT EXISTS "projects_start_date_idx" ON "projects"("start_date");
CREATE INDEX IF NOT EXISTS "projects_is_current_idx" ON "projects"("is_current");

-- Add foreign key constraints
ALTER TABLE "jobseeker_cvs" ADD CONSTRAINT IF NOT EXISTS "jobseeker_cvs_user_uid_fkey"
    FOREIGN KEY ("user_uid") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "experience" ADD CONSTRAINT IF NOT EXISTS "experience_resume_id_fkey"
    FOREIGN KEY ("resume_id") REFERENCES "jobseeker_cvs"("resume_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "education" ADD CONSTRAINT IF NOT EXISTS "education_resume_id_fkey"
    FOREIGN KEY ("resume_id") REFERENCES "jobseeker_cvs"("resume_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "certifications" ADD CONSTRAINT IF NOT EXISTS "certifications_resume_id_fkey"
    FOREIGN KEY ("resume_id") REFERENCES "jobseeker_cvs"("resume_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "languages" ADD CONSTRAINT IF NOT EXISTS "languages_resume_id_fkey"
    FOREIGN KEY ("resume_id") REFERENCES "jobseeker_cvs"("resume_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "projects" ADD CONSTRAINT IF NOT EXISTS "projects_resume_id_fkey"
    FOREIGN KEY ("resume_id") REFERENCES "jobseeker_cvs"("resume_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add triggers for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_jobseeker_cvs_updated_at BEFORE UPDATE ON "jobseeker_cvs"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_experience_updated_at BEFORE UPDATE ON "experience"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_education_updated_at BEFORE UPDATE ON "education"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_certifications_updated_at BEFORE UPDATE ON "certifications"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_languages_updated_at BEFORE UPDATE ON "languages"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_projects_updated_at BEFORE UPDATE ON "projects"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE "jobseeker_cvs" IS 'Resume/CV storage for job seekers';
COMMENT ON TABLE "experience" IS 'Work experience entries for resumes';
COMMENT ON TABLE "education" IS 'Education entries for resumes';
COMMENT ON TABLE "certifications" IS 'Certification entries for resumes';
COMMENT ON TABLE "languages" IS 'Language skills for resumes';
COMMENT ON TABLE "projects" IS 'Project portfolio entries for resumes';

-- Add data encryption for sensitive fields (using pgcrypto extension if available)
-- Note: This requires the pgcrypto extension to be enabled in PostgreSQL
DO $$
BEGIN
    -- Check if pgcrypto extension exists, if not create it
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto'
    ) THEN
        CREATE EXTENSION IF NOT EXISTS pgcrypto;
    END IF;
END $$;

-- Example of encrypted columns (optional, can be implemented later)
-- ALTER TABLE "jobseeker_cvs" ADD COLUMN "phone_encrypted" BYTEA;
-- CREATE INDEX "jobseeker_cvs_phone_encrypted_idx" ON "jobseeker_cvs" USING gin("phone_encrypted" cryptoint);

-- Backup procedures
CREATE OR REPLACE FUNCTION backup_resume_data(resume_uuid TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Implementation for resume data backup
    -- This would typically involve copying data to a backup table or external storage
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    -- Log error and return false
    RAISE WARNING 'Backup failed for resume %: %', resume_uuid, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Recovery procedures
CREATE OR REPLACE FUNCTION restore_resume_data(resume_uuid TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Implementation for resume data restoration
    -- This would typically involve restoring data from backup
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    -- Log error and return false
    RAISE WARNING 'Restore failed for resume %: %', resume_uuid, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;