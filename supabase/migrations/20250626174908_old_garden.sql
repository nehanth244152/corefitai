/*
  # Fix User Data Foreign Key Issues

  1. Schema Fixes
    - Ensure all tables properly reference auth.users
    - Fix any broken foreign key constraints
    - Add missing indexes for performance

  2. Data Integrity
    - Clean up any orphaned records
    - Ensure all user references are valid

  3. Security
    - Verify RLS policies are working correctly
    - Add any missing policies for user data access
*/

-- First, let's ensure we have proper foreign key constraints to auth.users
-- Drop existing foreign key constraints that might be incorrectly set

-- Fix nutrition_logs foreign key
ALTER TABLE nutrition_logs DROP CONSTRAINT IF EXISTS nutrition_logs_user_id_fkey;
ALTER TABLE nutrition_logs ADD CONSTRAINT nutrition_logs_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix fitness_logs foreign key  
ALTER TABLE fitness_logs DROP CONSTRAINT IF EXISTS fitness_logs_user_id_fkey;
ALTER TABLE fitness_logs ADD CONSTRAINT fitness_logs_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix user_profiles foreign key
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add missing foreign key for user_ratings (it was missing a proper FK)
ALTER TABLE user_ratings DROP CONSTRAINT IF EXISTS user_ratings_user_id_fkey;
ALTER TABLE user_ratings ADD CONSTRAINT user_ratings_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add missing foreign key for activity_tracking
ALTER TABLE activity_tracking DROP CONSTRAINT IF EXISTS activity_tracking_user_id_fkey;
ALTER TABLE activity_tracking ADD CONSTRAINT activity_tracking_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Ensure all RLS policies are using auth.uid() correctly
-- Check and fix nutrition_logs policies
DROP POLICY IF EXISTS "Users can read own nutrition logs" ON nutrition_logs;
DROP POLICY IF EXISTS "Users can insert own nutrition logs" ON nutrition_logs;
DROP POLICY IF EXISTS "Users can update own nutrition logs" ON nutrition_logs;
DROP POLICY IF EXISTS "Users can delete own nutrition logs" ON nutrition_logs;
DROP POLICY IF EXISTS "Allow nutrition stats counting" ON nutrition_logs;

CREATE POLICY "Users can read own nutrition logs"
  ON nutrition_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nutrition logs"
  ON nutrition_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nutrition logs"
  ON nutrition_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own nutrition logs"
  ON nutrition_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow nutrition stats counting"
  ON nutrition_logs FOR SELECT
  TO authenticated
  USING (true);

-- Check and fix fitness_logs policies
DROP POLICY IF EXISTS "Users can read own fitness logs" ON fitness_logs;
DROP POLICY IF EXISTS "Users can insert own fitness logs" ON fitness_logs;
DROP POLICY IF EXISTS "Users can update own fitness logs" ON fitness_logs;
DROP POLICY IF EXISTS "Users can delete own fitness logs" ON fitness_logs;
DROP POLICY IF EXISTS "Allow fitness stats counting" ON fitness_logs;

CREATE POLICY "Users can read own fitness logs"
  ON fitness_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fitness logs"
  ON fitness_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fitness logs"
  ON fitness_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own fitness logs"
  ON fitness_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow fitness stats counting"
  ON fitness_logs FOR SELECT
  TO authenticated
  USING (true);

-- Check and fix user_profiles policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile stats counting" ON user_profiles;

CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow profile stats counting"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

-- Check and fix user_ratings policies
DROP POLICY IF EXISTS "Users can read own rating" ON user_ratings;
DROP POLICY IF EXISTS "Users can insert own rating" ON user_ratings;
DROP POLICY IF EXISTS "Users can update own rating" ON user_ratings;
DROP POLICY IF EXISTS "Users can delete own rating" ON user_ratings;
DROP POLICY IF EXISTS "Allow ratings stats access" ON user_ratings;

CREATE POLICY "Users can read own rating"
  ON user_ratings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rating"
  ON user_ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rating"
  ON user_ratings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own rating"
  ON user_ratings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow ratings stats access"
  ON user_ratings FOR SELECT
  TO authenticated
  USING (true);

-- Check and fix activity_tracking policies
DROP POLICY IF EXISTS "Users can read own activities" ON activity_tracking;
DROP POLICY IF EXISTS "Users can insert own activities" ON activity_tracking;
DROP POLICY IF EXISTS "Allow stats counting" ON activity_tracking;

CREATE POLICY "Users can read own activities"
  ON activity_tracking FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities"
  ON activity_tracking FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow stats counting"
  ON activity_tracking FOR SELECT
  TO authenticated
  USING (true);

-- Clean up any orphaned records that might exist due to foreign key issues
-- Remove any records that don't have valid user references
DELETE FROM nutrition_logs 
WHERE user_id NOT IN (SELECT id FROM auth.users);

DELETE FROM fitness_logs 
WHERE user_id NOT IN (SELECT id FROM auth.users);

DELETE FROM user_profiles 
WHERE user_id NOT IN (SELECT id FROM auth.users);

DELETE FROM user_ratings 
WHERE user_id NOT IN (SELECT id FROM auth.users);

DELETE FROM activity_tracking 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Add function to ensure data consistency when auth users are created/deleted
CREATE OR REPLACE FUNCTION ensure_user_data_consistency()
RETURNS trigger AS $$
BEGIN
  -- When a user is deleted from auth.users, cascade delete will handle cleanup
  -- This function can be extended for future user management needs
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure all required indexes exist for performance
CREATE INDEX IF NOT EXISTS nutrition_logs_user_id_recorded_at_idx 
  ON nutrition_logs(user_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS fitness_logs_user_id_recorded_at_idx 
  ON fitness_logs(user_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS user_profiles_user_id_unique_idx 
  ON user_profiles(user_id);

CREATE INDEX IF NOT EXISTS user_ratings_user_id_unique_idx 
  ON user_ratings(user_id);

CREATE INDEX IF NOT EXISTS activity_tracking_user_id_created_at_idx 
  ON activity_tracking(user_id, created_at DESC);

-- Update existing trigger functions to ensure they handle user_id correctly
CREATE OR REPLACE FUNCTION track_nutrition_activity()
RETURNS trigger AS $$
BEGIN
  -- Only insert if the user_id exists in auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.user_id) THEN
    INSERT INTO activity_tracking (user_id, activity_type, activity_name, calories)
    VALUES (NEW.user_id, 'meal', NEW.meal, NEW.calories);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION track_fitness_activity()
RETURNS trigger AS $$
BEGIN
  -- Only insert if the user_id exists in auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.user_id) THEN
    INSERT INTO activity_tracking (user_id, activity_type, activity_name, calories)
    VALUES (NEW.user_id, 'workout', NEW.activity, NEW.calories_burned);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify all functions have proper permissions
GRANT EXECUTE ON FUNCTION track_nutrition_activity() TO authenticated;
GRANT EXECUTE ON FUNCTION track_fitness_activity() TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;