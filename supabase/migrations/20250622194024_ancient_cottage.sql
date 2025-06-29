/*
  # Create user_profiles table

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, unique, foreign key to users)
      - `age` (integer, with constraints)
      - `weight` (numeric, with constraints)
      - `height` (numeric, with constraints)
      - `gender` (text, with constraints)
      - `activity_level` (text, with constraints)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on `user_profiles` table
    - Add policies for authenticated users to manage their own data
  3. Indexes
    - Add index on user_id for performance
*/

-- Create the user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  age integer NOT NULL,
  weight numeric(5,2) NOT NULL,
  height numeric(5,2) NOT NULL,
  gender text NOT NULL,
  activity_level text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Add constraints
  CONSTRAINT user_profiles_age_check CHECK (age > 0 AND age < 150),
  CONSTRAINT user_profiles_weight_check CHECK (weight > 0::numeric AND weight < 1000::numeric),
  CONSTRAINT user_profiles_height_check CHECK (height > 0::numeric AND height < 300::numeric),
  CONSTRAINT user_profiles_gender_check CHECK (gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text])),
  CONSTRAINT user_profiles_activity_level_check CHECK (activity_level = ANY (ARRAY['sedentary'::text, 'lightly_active'::text, 'moderately_active'::text, 'very_active'::text, 'extremely_active'::text]))
);

-- Add foreign key constraint to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_profiles_user_id_fkey'
  ) THEN
    ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON user_profiles USING btree (user_id);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  -- Drop policies if they exist
  DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;
END $$;

-- Create RLS policies
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create or replace the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating updated_at column
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();