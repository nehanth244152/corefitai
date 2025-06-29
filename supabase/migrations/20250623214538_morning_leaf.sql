/*
  # Create Activity Tracking Table

  1. New Tables
    - `activity_tracking`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `activity_type` (text: 'meal' or 'workout')
      - `activity_name` (text)
      - `calories` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `activity_tracking` table
    - Add policies for authenticated users to manage their own activities

  3. Functions
    - Trigger functions to automatically populate this table when nutrition/fitness logs are created
*/

-- Create the activity tracking table
CREATE TABLE IF NOT EXISTS activity_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('meal', 'workout')),
  activity_name text NOT NULL,
  calories integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS activity_tracking_user_id_idx ON activity_tracking USING btree (user_id);
CREATE INDEX IF NOT EXISTS activity_tracking_created_at_idx ON activity_tracking USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS activity_tracking_type_idx ON activity_tracking USING btree (activity_type);

-- Enable Row Level Security
ALTER TABLE activity_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Function to track nutrition activities
CREATE OR REPLACE FUNCTION track_nutrition_activity()
RETURNS trigger AS $$
BEGIN
  INSERT INTO activity_tracking (user_id, activity_type, activity_name, calories)
  VALUES (NEW.user_id, 'meal', NEW.meal, NEW.calories);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track fitness activities
CREATE OR REPLACE FUNCTION track_fitness_activity()
RETURNS trigger AS $$
BEGIN
  INSERT INTO activity_tracking (user_id, activity_type, activity_name, calories)
  VALUES (NEW.user_id, 'workout', NEW.activity, NEW.calories_burned);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically populate activity tracking
CREATE TRIGGER nutrition_activity_trigger
  AFTER INSERT ON nutrition_logs
  FOR EACH ROW
  EXECUTE FUNCTION track_nutrition_activity();

CREATE TRIGGER fitness_activity_trigger
  AFTER INSERT ON fitness_logs
  FOR EACH ROW
  EXECUTE FUNCTION track_fitness_activity();

-- Populate existing data
INSERT INTO activity_tracking (user_id, activity_type, activity_name, calories, created_at)
SELECT user_id, 'meal', meal, calories, created_at
FROM nutrition_logs
ON CONFLICT DO NOTHING;

INSERT INTO activity_tracking (user_id, activity_type, activity_name, calories, created_at)
SELECT user_id, 'workout', activity, calories_burned, created_at
FROM fitness_logs
ON CONFLICT DO NOTHING;