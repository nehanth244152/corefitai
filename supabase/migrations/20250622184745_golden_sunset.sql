/*
  # Create fitness logs table

  1. New Tables
    - `fitness_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `activity` (text, activity type)
      - `duration` (integer, duration in minutes)
      - `calories_burned` (integer, estimated calories burned)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `fitness_logs` table
    - Add policy for users to read their own fitness logs
    - Add policy for users to insert their own fitness logs
    - Add policy for users to update their own fitness logs
    - Add policy for users to delete their own fitness logs
*/

CREATE TABLE IF NOT EXISTS fitness_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity text NOT NULL,
  duration integer NOT NULL DEFAULT 0,
  calories_burned integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE fitness_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own fitness logs"
  ON fitness_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fitness logs"
  ON fitness_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fitness logs"
  ON fitness_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own fitness logs"
  ON fitness_logs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS fitness_logs_user_id_idx ON fitness_logs(user_id);
CREATE INDEX IF NOT EXISTS fitness_logs_created_at_idx ON fitness_logs(created_at DESC);

-- Create updated_at trigger
CREATE TRIGGER update_fitness_logs_updated_at
  BEFORE UPDATE ON fitness_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();