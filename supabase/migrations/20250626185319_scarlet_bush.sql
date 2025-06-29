/*
  # Create user goals table

  1. New Tables
    - `user_goals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `goal_type` (text, with constraints)
      - `target_value` (numeric, with constraints)
      - `current_value` (numeric, default 0)
      - `unit` (text, with constraints)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_goals` table
    - Add policies for authenticated users to manage their own goals

  3. Constraints and Indexes
    - Unique constraint for one active goal per type per user
    - Check constraints for valid goal types and units
    - Indexes for performance
*/

-- Create user_goals table
CREATE TABLE IF NOT EXISTS user_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  goal_type text NOT NULL,
  target_value numeric(10,2) NOT NULL,
  current_value numeric(10,2) DEFAULT 0,
  unit text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraint to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_goals_user_id_fkey'
  ) THEN
    ALTER TABLE user_goals 
    ADD CONSTRAINT user_goals_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add check constraints
DO $$
BEGIN
  -- Check constraint for valid goal types
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'user_goals_goal_type_check'
  ) THEN
    ALTER TABLE user_goals 
    ADD CONSTRAINT user_goals_goal_type_check 
    CHECK (goal_type = ANY (ARRAY['daily_calories'::text, 'daily_protein'::text, 'daily_carbs'::text, 'daily_fats'::text, 'weekly_workouts'::text, 'daily_water'::text, 'target_weight'::text]));
  END IF;

  -- Check constraint for valid units
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'user_goals_unit_check'
  ) THEN
    ALTER TABLE user_goals 
    ADD CONSTRAINT user_goals_unit_check 
    CHECK (unit = ANY (ARRAY['calories'::text, 'grams'::text, 'liters'::text, 'kg'::text, 'workouts'::text, 'minutes'::text]));
  END IF;

  -- Check constraint for positive target values
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'user_goals_target_value_check'
  ) THEN
    ALTER TABLE user_goals 
    ADD CONSTRAINT user_goals_target_value_check 
    CHECK (target_value > 0::numeric);
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS user_goals_user_id_idx ON user_goals USING btree (user_id);
CREATE INDEX IF NOT EXISTS user_goals_type_idx ON user_goals USING btree (goal_type);
CREATE INDEX IF NOT EXISTS user_goals_active_idx ON user_goals USING btree (is_active) WHERE (is_active = true);

-- Create unique constraint for active goals per user per type
CREATE UNIQUE INDEX IF NOT EXISTS user_goals_unique_active_goal 
ON user_goals USING btree (user_id, goal_type) 
WHERE (is_active = true);

-- Enable Row Level Security
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Users can read own goals" ON user_goals;
CREATE POLICY "Users can read own goals"
  ON user_goals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own goals" ON user_goals;
CREATE POLICY "Users can insert own goals"
  ON user_goals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own goals" ON user_goals;
CREATE POLICY "Users can update own goals"
  ON user_goals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own goals" ON user_goals;
CREATE POLICY "Users can delete own goals"
  ON user_goals
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger for updating updated_at column
DROP TRIGGER IF EXISTS update_user_goals_updated_at ON user_goals;
CREATE TRIGGER update_user_goals_updated_at
  BEFORE UPDATE ON user_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update goal progress automatically
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS trigger AS $$
DECLARE
  goal_record RECORD;
BEGIN
  -- Update daily calorie goal when nutrition is logged
  IF TG_TABLE_NAME = 'nutrition_logs' THEN
    -- Update daily calories goal
    SELECT * INTO goal_record FROM user_goals 
    WHERE user_id = NEW.user_id 
    AND goal_type = 'daily_calories' 
    AND is_active = true;
    
    IF FOUND THEN
      UPDATE user_goals 
      SET current_value = (
        SELECT COALESCE(SUM(calories), 0) 
        FROM nutrition_logs 
        WHERE user_id = NEW.user_id 
        AND DATE(recorded_at) = CURRENT_DATE
      )
      WHERE id = goal_record.id;
    END IF;
    
    -- Update daily protein goal
    SELECT * INTO goal_record FROM user_goals 
    WHERE user_id = NEW.user_id 
    AND goal_type = 'daily_protein' 
    AND is_active = true;
    
    IF FOUND THEN
      UPDATE user_goals 
      SET current_value = (
        SELECT COALESCE(SUM(protein), 0) 
        FROM nutrition_logs 
        WHERE user_id = NEW.user_id 
        AND DATE(recorded_at) = CURRENT_DATE
      )
      WHERE id = goal_record.id;
    END IF;

    -- Update daily carbs goal
    SELECT * INTO goal_record FROM user_goals 
    WHERE user_id = NEW.user_id 
    AND goal_type = 'daily_carbs' 
    AND is_active = true;
    
    IF FOUND THEN
      UPDATE user_goals 
      SET current_value = (
        SELECT COALESCE(SUM(carbs), 0) 
        FROM nutrition_logs 
        WHERE user_id = NEW.user_id 
        AND DATE(recorded_at) = CURRENT_DATE
      )
      WHERE id = goal_record.id;
    END IF;

    -- Update daily fats goal
    SELECT * INTO goal_record FROM user_goals 
    WHERE user_id = NEW.user_id 
    AND goal_type = 'daily_fats' 
    AND is_active = true;
    
    IF FOUND THEN
      UPDATE user_goals 
      SET current_value = (
        SELECT COALESCE(SUM(fats), 0) 
        FROM nutrition_logs 
        WHERE user_id = NEW.user_id 
        AND DATE(recorded_at) = CURRENT_DATE
      )
      WHERE id = goal_record.id;
    END IF;
  END IF;
  
  -- Update weekly workout goal when fitness is logged
  IF TG_TABLE_NAME = 'fitness_logs' THEN
    SELECT * INTO goal_record FROM user_goals 
    WHERE user_id = NEW.user_id 
    AND goal_type = 'weekly_workouts' 
    AND is_active = true;
    
    IF FOUND THEN
      UPDATE user_goals 
      SET current_value = (
        SELECT COUNT(*) 
        FROM fitness_logs 
        WHERE user_id = NEW.user_id 
        AND recorded_at >= DATE_TRUNC('week', CURRENT_DATE)
        AND recorded_at < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
      )
      WHERE id = goal_record.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically update goal progress
DROP TRIGGER IF EXISTS update_nutrition_goal_progress ON nutrition_logs;
CREATE TRIGGER update_nutrition_goal_progress
  AFTER INSERT OR UPDATE ON nutrition_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_progress();

DROP TRIGGER IF EXISTS update_fitness_goal_progress ON fitness_logs;
CREATE TRIGGER update_fitness_goal_progress
  AFTER INSERT OR UPDATE ON fitness_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_progress();