/*
  # Create nutrition logs table

  1. New Tables
    - `nutrition_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `meal` (text, meal description)
      - `calories` (integer, calories consumed)
      - `protein` (integer, protein in grams)
      - `carbs` (integer, carbohydrates in grams)
      - `fats` (integer, fats in grams)
      - `image_url` (text, optional image URL)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `nutrition_logs` table
    - Add policy for users to read their own nutrition logs
    - Add policy for users to insert their own nutrition logs
    - Add policy for users to update their own nutrition logs
    - Add policy for users to delete their own nutrition logs
*/

CREATE TABLE IF NOT EXISTS nutrition_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meal text NOT NULL,
  calories integer NOT NULL DEFAULT 0,
  protein integer NOT NULL DEFAULT 0,
  carbs integer NOT NULL DEFAULT 0,
  fats integer NOT NULL DEFAULT 0,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own nutrition logs"
  ON nutrition_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nutrition logs"
  ON nutrition_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nutrition logs"
  ON nutrition_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own nutrition logs"
  ON nutrition_logs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS nutrition_logs_user_id_idx ON nutrition_logs(user_id);
CREATE INDEX IF NOT EXISTS nutrition_logs_created_at_idx ON nutrition_logs(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_nutrition_logs_updated_at
  BEFORE UPDATE ON nutrition_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();