/*
  # Comprehensive User Data Fix

  1. Issues Fixed
    - Foreign key references pointing to non-existent 'users' table instead of 'auth.users'
    - Missing or incorrect RLS policies
    - Data integrity issues
    - Missing user data visibility

  2. Database Structure
    - Create a public users table that mirrors auth.users for proper foreign key relationships
    - Set up triggers to keep it in sync with auth.users
    - Fix all foreign key constraints
    - Ensure proper RLS policies

  3. Data Recovery
    - Clean up any orphaned records
    - Ensure all user data is properly linked
*/

-- Create a public users table that mirrors auth.users
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for public.users
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Service role can manage all users" ON public.users
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to sync auth.users with public.users
CREATE OR REPLACE FUNCTION sync_user_to_public()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.users (id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NEW.created_at, NEW.updated_at)
    ON CONFLICT (id) DO UPDATE SET
      email = NEW.email,
      updated_at = NEW.updated_at;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.users
    SET email = NEW.email, updated_at = NEW.updated_at
    WHERE id = NEW.id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.users WHERE id = OLD.id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to keep public.users in sync with auth.users
DROP TRIGGER IF EXISTS sync_user_insert ON auth.users;
DROP TRIGGER IF EXISTS sync_user_update ON auth.users;
DROP TRIGGER IF EXISTS sync_user_delete ON auth.users;

CREATE TRIGGER sync_user_insert
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_user_to_public();

CREATE TRIGGER sync_user_update
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_user_to_public();

CREATE TRIGGER sync_user_delete
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_user_to_public();

-- Populate public.users with existing auth.users data
INSERT INTO public.users (id, email, created_at, updated_at)
SELECT id, email, created_at, updated_at
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = EXCLUDED.updated_at;

-- Now fix all foreign key constraints to use public.users
-- This ensures data integrity while maintaining compatibility

-- Fix nutrition_logs
ALTER TABLE nutrition_logs DROP CONSTRAINT IF EXISTS nutrition_logs_user_id_fkey;
ALTER TABLE nutrition_logs ADD CONSTRAINT nutrition_logs_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Fix fitness_logs  
ALTER TABLE fitness_logs DROP CONSTRAINT IF EXISTS fitness_logs_user_id_fkey;
ALTER TABLE fitness_logs ADD CONSTRAINT fitness_logs_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Fix user_profiles
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Fix user_ratings
ALTER TABLE user_ratings DROP CONSTRAINT IF EXISTS user_ratings_user_id_fkey;
ALTER TABLE user_ratings ADD CONSTRAINT user_ratings_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Fix activity_tracking
ALTER TABLE activity_tracking DROP CONSTRAINT IF EXISTS activity_tracking_user_id_fkey;
ALTER TABLE activity_tracking ADD CONSTRAINT activity_tracking_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Clean up any orphaned records
DELETE FROM nutrition_logs 
WHERE user_id NOT IN (SELECT id FROM public.users);

DELETE FROM fitness_logs 
WHERE user_id NOT IN (SELECT id FROM public.users);

DELETE FROM user_profiles 
WHERE user_id NOT IN (SELECT id FROM public.users);

DELETE FROM user_ratings 
WHERE user_id NOT IN (SELECT id FROM public.users);

DELETE FROM activity_tracking 
WHERE user_id NOT IN (SELECT id FROM public.users);

-- Ensure all RLS policies are properly set up and working
-- Nutrition logs policies
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

-- Fitness logs policies
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

-- User profiles policies
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

-- User ratings policies
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

-- Activity tracking policies
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

-- Add proper indexes for performance
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

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.users TO authenticated;
GRANT ALL ON nutrition_logs TO authenticated;
GRANT ALL ON fitness_logs TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_ratings TO authenticated;
GRANT ALL ON activity_tracking TO authenticated;

-- Update trigger functions to be more robust
CREATE OR REPLACE FUNCTION track_nutrition_activity()
RETURNS trigger AS $$
BEGIN
  -- Ensure the user exists in public.users before inserting
  IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.user_id) THEN
    INSERT INTO activity_tracking (user_id, activity_type, activity_name, calories, created_at)
    VALUES (NEW.user_id, 'meal', NEW.meal, NEW.calories, NEW.created_at)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION track_fitness_activity()
RETURNS trigger AS $$
BEGIN
  -- Ensure the user exists in public.users before inserting
  IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.user_id) THEN
    INSERT INTO activity_tracking (user_id, activity_type, activity_name, calories, created_at)
    VALUES (NEW.user_id, 'workout', NEW.activity, NEW.calories_burned, NEW.created_at)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure triggers are properly set up
DROP TRIGGER IF EXISTS nutrition_activity_trigger ON nutrition_logs;
DROP TRIGGER IF EXISTS fitness_activity_trigger ON fitness_logs;

CREATE TRIGGER nutrition_activity_trigger
  AFTER INSERT ON nutrition_logs
  FOR EACH ROW
  EXECUTE FUNCTION track_nutrition_activity();

CREATE TRIGGER fitness_activity_trigger
  AFTER INSERT ON fitness_logs
  FOR EACH ROW
  EXECUTE FUNCTION track_fitness_activity();

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION sync_user_to_public() TO authenticated;
GRANT EXECUTE ON FUNCTION track_nutrition_activity() TO authenticated;
GRANT EXECUTE ON FUNCTION track_fitness_activity() TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;