-- Migration: Add UserRole enum and update User.role field
-- This migration converts the existing string-based role field to use a proper enum

-- Step 1: Create the UserRole enum
CREATE TYPE "UserRole" AS ENUM ('JOB_SEEKER', 'EMPLOYER', 'ADMIN');

-- Step 2: Add a temporary column with the new enum type
ALTER TABLE "users" ADD COLUMN "role_new" "UserRole";

-- Step 3: Migrate existing data to the new enum values
UPDATE "users" SET "role_new" = 
  CASE 
    WHEN "role" = 'seeker' THEN 'JOB_SEEKER'::"UserRole"
    WHEN "role" = 'employer' THEN 'EMPLOYER'::"UserRole"
    WHEN "role" = 'admin' THEN 'ADMIN'::"UserRole"
    ELSE 'JOB_SEEKER'::"UserRole"  -- Default fallback
  END;

-- Step 4: Set default value for new column
ALTER TABLE "users" ALTER COLUMN "role_new" SET DEFAULT 'JOB_SEEKER'::"UserRole";

-- Step 5: Make the new column NOT NULL
ALTER TABLE "users" ALTER COLUMN "role_new" SET NOT NULL;

-- Step 6: Drop the old role column
ALTER TABLE "users" DROP COLUMN "role";

-- Step 7: Rename the new column to 'role'
ALTER TABLE "users" RENAME COLUMN "role_new" TO "role";

-- Step 8: Update any indexes or constraints if needed
-- (Add any additional constraints or indexes here if required)

-- Verification query (optional - can be removed in production)
-- SELECT role, COUNT(*) FROM users GROUP BY role;