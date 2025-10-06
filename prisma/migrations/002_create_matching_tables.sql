-- Create matching system tables
-- Migration: 002_create_matching_tables
-- Description: Add tables for candidate matching system with ML support

-- Create enhanced candidate profiles table
CREATE TABLE "candidate_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "personal_info" JSONB NOT NULL,
    "professional_summary" TEXT,
    "skills" JSONB NOT NULL DEFAULT '[]',
    "experience" JSONB NOT NULL DEFAULT '[]',
    "education" JSONB NOT NULL DEFAULT '[]',
    "certifications" JSONB NOT NULL DEFAULT '[]',
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "availability" JSONB NOT NULL DEFAULT '{}',
    "completion_score" INTEGER NOT NULL DEFAULT 0,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "allow_search" BOOLEAN NOT NULL DEFAULT true,
    "allow_direct_contact" BOOLEAN NOT NULL DEFAULT false,
    "anonymous_matching" BOOLEAN NOT NULL DEFAULT false,
    "data_retention_period" INTEGER NOT NULL DEFAULT 365,
    "last_profile_view" TIMESTAMP(3),
    "profile_views" INTEGER NOT NULL DEFAULT 0,
    "search_ranking" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "verification_status" TEXT NOT NULL DEFAULT 'unverified',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_profiles_pkey" PRIMARY KEY ("id")
);

-- Create unique index on user_id
CREATE UNIQUE INDEX "candidate_profiles_user_id_key" ON "candidate_profiles"("user_id");

-- Create indexes for candidate profiles
CREATE INDEX "candidate_profiles_user_id_idx" ON "candidate_profiles"("user_id");
CREATE INDEX "candidate_profiles_completion_score_idx" ON "candidate_profiles"("completion_score");
CREATE INDEX "candidate_profiles_visibility_idx" ON "candidate_profiles"("visibility");
CREATE INDEX "candidate_profiles_is_active_idx" ON "candidate_profiles"("is_active");
CREATE INDEX "candidate_profiles_search_ranking_idx" ON "candidate_profiles"("search_ranking");

-- Create enhanced job profiles table
CREATE TABLE "job_profiles" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "employer_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" JSONB NOT NULL DEFAULT '{}',
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "compensation" JSONB NOT NULL DEFAULT '{}',
    "company_info" JSONB NOT NULL DEFAULT '{}',
    "location" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "application_count" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "search_ranking" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "posted_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiry_date" TIMESTAMP(3),
    "urgency" TEXT NOT NULL DEFAULT 'medium',
    "last_updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_profiles_pkey" PRIMARY KEY ("id")
);

-- Create unique index on job_id
CREATE UNIQUE INDEX "job_profiles_job_id_key" ON "job_profiles"("job_id");

-- Create indexes for job profiles
CREATE INDEX "job_profiles_job_id_idx" ON "job_profiles"("job_id");
CREATE INDEX "job_profiles_employer_id_idx" ON "job_profiles"("employer_id");
CREATE INDEX "job_profiles_is_active_idx" ON "job_profiles"("is_active");
CREATE INDEX "job_profiles_search_ranking_idx" ON "job_profiles"("search_ranking");
CREATE INDEX "job_profiles_posted_date_idx" ON "job_profiles"("posted_date");
CREATE INDEX "job_profiles_expiry_date_idx" ON "job_profiles"("expiry_date");

-- Create enhanced match results table
CREATE TABLE "match_results" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,
    "explanation" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "feedback" JSONB,
    "recommendation_source" TEXT,
    "algorithm_version" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "match_results_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "match_results_candidate_id_job_id_key" UNIQUE ("candidate_id", "job_id")
);

-- Create indexes for match results
CREATE INDEX "match_results_candidate_id_idx" ON "match_results"("candidate_id");
CREATE INDEX "match_results_job_id_idx" ON "match_results"("job_id");
CREATE INDEX "match_results_score_idx" ON "match_results"("score");
CREATE INDEX "match_results_status_idx" ON "match_results"("status");
CREATE INDEX "match_results_created_at_idx" ON "match_results"("created_at");

-- Create user interactions table for ML training
CREATE TABLE "user_interactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "interaction_type" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "metadata" JSONB,
    "session_id" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_interactions_pkey" PRIMARY KEY ("id")
);

-- Create indexes for user interactions
CREATE INDEX "user_interactions_user_id_idx" ON "user_interactions"("user_id");
CREATE INDEX "user_interactions_interaction_type_idx" ON "user_interactions"("interaction_type");
CREATE INDEX "user_interactions_target_type_idx" ON "user_interactions"("target_type");
CREATE INDEX "user_interactions_target_id_idx" ON "user_interactions"("target_id");
CREATE INDEX "user_interactions_timestamp_idx" ON "user_interactions"("timestamp");
CREATE INDEX "user_interactions_session_id_idx" ON "user_interactions"("session_id");

-- Create ML models table for version management
CREATE TABLE "ml_models" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "features" JSONB NOT NULL,
    "model_data" BYTEA,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "trained_at" TIMESTAMP(3),
    "last_evaluated" TIMESTAMP(3),
    "metrics" JSONB,
    "hyperparameters" JSONB,
    "training_data_size" INTEGER,
    "validation_data_size" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ml_models_pkey" PRIMARY KEY ("id")
);

-- Create indexes for ML models
CREATE INDEX "ml_models_name_idx" ON "ml_models"("name");
CREATE INDEX "ml_models_type_idx" ON "ml_models"("type");
CREATE INDEX "ml_models_is_active_idx" ON "ml_models"("is_active");
CREATE INDEX "ml_models_trained_at_idx" ON "ml_models"("trained_at");

-- Create profile embeddings table for vector search
CREATE TABLE "profile_embeddings" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "profile_type" TEXT NOT NULL,
    "embedding" DOUBLE PRECISION[] NOT NULL,
    "metadata" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "dimensions" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_embeddings_pkey" PRIMARY KEY ("id")
);

-- Create indexes for profile embeddings
CREATE INDEX "profile_embeddings_profile_id_idx" ON "profile_embeddings"("profile_id");
CREATE INDEX "profile_embeddings_profile_type_idx" ON "profile_embeddings"("profile_type");
CREATE INDEX "profile_embeddings_model_idx" ON "profile_embeddings"("model");
CREATE INDEX "profile_embeddings_created_at_idx" ON "profile_embeddings"("created_at");

-- Create recommendations storage table
CREATE TABLE "recommendations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "recommendation_strategy" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_viewed" BOOLEAN NOT NULL DEFAULT false,
    "is_clicked" BOOLEAN NOT NULL DEFAULT false,
    "is_saved" BOOLEAN NOT NULL DEFAULT false,
    "is_dismissed" BOOLEAN NOT NULL DEFAULT false,
    "feedback" JSONB,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- Create indexes for recommendations
CREATE INDEX "recommendations_user_id_idx" ON "recommendations"("user_id");
CREATE INDEX "recommendations_target_id_idx" ON "recommendations"("target_id");
CREATE INDEX "recommendations_type_idx" ON "recommendations"("type");
CREATE INDEX "recommendations_score_idx" ON "recommendations"("score");
CREATE INDEX "recommendations_strategy_idx" ON "recommendations"("recommendation_strategy");
CREATE INDEX "recommendations_is_active_idx" ON "recommendations"("is_active");
CREATE INDEX "recommendations_expires_at_idx" ON "recommendations"("expires_at");

-- Create batch processing jobs table
CREATE TABLE "batch_match_jobs" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "profile_ids" TEXT[] NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "total_profiles" INTEGER NOT NULL,
    "processed_profiles" INTEGER NOT NULL DEFAULT 0,
    "results" JSONB,
    "error" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batch_match_jobs_pkey" PRIMARY KEY ("id")
);

-- Create indexes for batch match jobs
CREATE INDEX "batch_match_jobs_type_idx" ON "batch_match_jobs"("type");
CREATE INDEX "batch_match_jobs_status_idx" ON "batch_match_jobs"("status");
CREATE INDEX "batch_match_jobs_priority_idx" ON "batch_match_jobs"("priority");
CREATE INDEX "batch_match_jobs_created_by_idx" ON "batch_match_jobs"("created_by");
CREATE INDEX "batch_match_jobs_created_at_idx" ON "batch_match_jobs"("created_at");

-- Create matching analytics and metrics table
CREATE TABLE "matching_analytics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_matches" INTEGER NOT NULL DEFAULT 0,
    "average_score" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "match_conversion_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "user_satisfaction" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "algorithm_accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "average_response_time" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "total_recommendations" INTEGER NOT NULL DEFAULT 0,
    "recommendation_ctr" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "active_users" INTEGER NOT NULL DEFAULT 0,
    "new_profiles" INTEGER NOT NULL DEFAULT 0,
    "new_jobs" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,

    CONSTRAINT "matching_analytics_pkey" PRIMARY KEY ("id")
);

-- Create unique index on date for daily analytics
CREATE UNIQUE INDEX "matching_analytics_date_key" ON "matching_analytics"("date");
CREATE INDEX "matching_analytics_date_idx" ON "matching_analytics"("date");

-- Add foreign key constraints
ALTER TABLE "candidate_profiles" ADD CONSTRAINT "candidate_profiles_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "job_profiles" ADD CONSTRAINT "job_profiles_job_id_fkey"
    FOREIGN KEY ("job_id") REFERENCES "jobs"("job_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "job_profiles" ADD CONSTRAINT "job_profiles_employer_id_fkey"
    FOREIGN KEY ("employer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "match_results" ADD CONSTRAINT "match_results_candidate_id_fkey"
    FOREIGN KEY ("candidate_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "match_results" ADD CONSTRAINT "match_results_job_id_fkey"
    FOREIGN KEY ("job_id") REFERENCES "job_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_interactions" ADD CONSTRAINT "user_interactions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_candidate_profiles_updated_at BEFORE UPDATE ON "candidate_profiles"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_profiles_updated_at BEFORE UPDATE ON "job_profiles"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_match_results_updated_at BEFORE UPDATE ON "match_results"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ml_models_updated_at BEFORE UPDATE ON "ml_models"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profile_embeddings_updated_at BEFORE UPDATE ON "profile_embeddings"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recommendations_updated_at BEFORE UPDATE ON "recommendations"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_batch_match_jobs_updated_at BEFORE UPDATE ON "batch_match_jobs"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE "candidate_profiles" IS 'Enhanced candidate profiles for AI matching system';
COMMENT ON TABLE "job_profiles" IS 'Enhanced job profiles for AI matching system';
COMMENT ON TABLE "match_results" IS 'Detailed match results with scoring breakdown';
COMMENT ON TABLE "user_interactions" IS 'User interaction tracking for ML training data';
COMMENT ON TABLE "ml_models" IS 'ML model version management and storage';
COMMENT ON TABLE "profile_embeddings" IS 'Vector embeddings for semantic similarity search';
COMMENT ON TABLE "recommendations" IS 'Personalized recommendations storage';
COMMENT ON TABLE "batch_match_jobs" IS 'Batch processing job management';
COMMENT ON TABLE "matching_analytics" IS 'Daily analytics and metrics for matching system';