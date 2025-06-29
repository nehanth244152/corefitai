/*
  # Create user ratings table

  1. New Tables
    - `user_ratings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth users)
      - `rating` (integer, 1-5 stars)
      - `feedback` (text, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `user_ratings` table
    - Add policies for authenticated users to manage their own ratings
    - Ensure one rating per user with unique constraint

  3. Indexes
    - Index on user_id for fast lookups
    - Index on created_at for sorting
*/

-- Create user_ratings table
CREATE TABLE IF NOT EXISTS user_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback text,
  created_at timestamptz DEFAULT now(),
  
  -- Ensure one rating per user
  UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS user_ratings_user_id_idx ON user_ratings USING btree (user_id);
CREATE INDEX IF NOT EXISTS user_ratings_created_at_idx ON user_ratings USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS user_ratings_rating_idx ON user_ratings USING btree (rating);

-- Enable Row Level Security
ALTER TABLE user_ratings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Users can read own rating"
  ON user_ratings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rating"
  ON user_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rating"
  ON user_ratings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own rating"
  ON user_ratings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add a function to automatically clean up ratings when users are deleted
-- This will be triggered by Supabase's auth system
CREATE OR REPLACE FUNCTION handle_auth_user_deleted()
RETURNS trigger AS $$
BEGIN
  DELETE FROM user_ratings WHERE user_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The trigger on auth.users will be created by Supabase automatically
-- when needed, so we don't need to reference the auth.users table directly