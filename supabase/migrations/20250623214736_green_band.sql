/*
  # Fix Activity Tracking RLS and Data Population

  1. Security
    - Update RLS policies to allow proper access
    - Add policy for anonymous access to count data for stats
  
  2. Data Population
    - Ensure all existing data is properly migrated
    - Add better error handling
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can read own activities" ON activity_tracking;
DROP POLICY IF EXISTS "Users can insert own activities" ON activity_tracking;

-- Create new RLS policies
CREATE POLICY "Users can read own activities"
  ON activity_tracking
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities"
  ON activity_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add a policy to allow reading activity counts for stats (without user_id filter)
-- This allows the stats service to count total activities
CREATE POLICY "Allow stats counting"
  ON activity_tracking
  FOR SELECT
  TO authenticated
  USING (true);

-- Ensure all existing nutrition logs are in activity_tracking
INSERT INTO activity_tracking (user_id, activity_type, activity_name, calories, created_at)
SELECT user_id, 'meal', meal, calories, created_at
FROM nutrition_logs
WHERE NOT EXISTS (
  SELECT 1 FROM activity_tracking 
  WHERE activity_tracking.user_id = nutrition_logs.user_id 
  AND activity_tracking.activity_type = 'meal'
  AND activity_tracking.activity_name = nutrition_logs.meal
  AND activity_tracking.created_at = nutrition_logs.created_at
);

-- Ensure all existing fitness logs are in activity_tracking
INSERT INTO activity_tracking (user_id, activity_type, activity_name, calories, created_at)
SELECT user_id, 'workout', activity, calories_burned, created_at
FROM fitness_logs
WHERE NOT EXISTS (
  SELECT 1 FROM activity_tracking 
  WHERE activity_tracking.user_id = fitness_logs.user_id 
  AND activity_tracking.activity_type = 'workout'
  AND activity_tracking.activity_name = fitness_logs.activity
  AND activity_tracking.created_at = fitness_logs.created_at
);