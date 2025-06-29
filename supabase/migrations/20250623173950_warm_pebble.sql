/*
  # Add recorded_at tracking to nutrition and fitness logs

  1. Schema Changes
    - Add `recorded_at` column to `nutrition_logs` table
    - Add `recorded_at` column to `fitness_logs` table
    - Set default values for existing records
    - Add indexes for efficient weekly queries

  2. Data Migration
    - Update existing records to use created_at as recorded_at
    - Ensure all records have valid recorded_at values

  3. Performance
    - Add composite indexes for user_id + recorded_at queries
    - Add single column indexes for recorded_at ordering
*/

-- Add recorded_at column to nutrition_logs if it doesn't exist
ALTER TABLE nutrition_logs 
ADD COLUMN IF NOT EXISTS recorded_at timestamptz DEFAULT now();

-- Update existing nutrition records to have recorded_at same as created_at
UPDATE nutrition_logs 
SET recorded_at = COALESCE(created_at, now()) 
WHERE recorded_at IS NULL;

-- Ensure recorded_at is not null for nutrition_logs
UPDATE nutrition_logs 
SET recorded_at = now() 
WHERE recorded_at IS NULL;

-- Add recorded_at column to fitness_logs if it doesn't exist
ALTER TABLE fitness_logs 
ADD COLUMN IF NOT EXISTS recorded_at timestamptz DEFAULT now();

-- Update existing fitness records to have recorded_at same as created_at
UPDATE fitness_logs 
SET recorded_at = COALESCE(created_at, now()) 
WHERE recorded_at IS NULL;

-- Ensure recorded_at is not null for fitness_logs
UPDATE fitness_logs 
SET recorded_at = now() 
WHERE recorded_at IS NULL;

-- Add indexes for efficient weekly queries on nutrition_logs
CREATE INDEX IF NOT EXISTS nutrition_logs_recorded_at_idx 
ON nutrition_logs(recorded_at DESC);

CREATE INDEX IF NOT EXISTS nutrition_logs_user_recorded_at_idx 
ON nutrition_logs(user_id, recorded_at DESC);

-- Add indexes for efficient weekly queries on fitness_logs
CREATE INDEX IF NOT EXISTS fitness_logs_recorded_at_idx 
ON fitness_logs(recorded_at DESC);

CREATE INDEX IF NOT EXISTS fitness_logs_user_recorded_at_idx 
ON fitness_logs(user_id, recorded_at DESC);

-- Set NOT NULL constraint after ensuring all records have values
ALTER TABLE nutrition_logs 
ALTER COLUMN recorded_at SET NOT NULL;

ALTER TABLE fitness_logs 
ALTER COLUMN recorded_at SET NOT NULL;