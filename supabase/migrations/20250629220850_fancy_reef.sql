/*
  # Fix Goal Reset Functions and Add Last Reset Tracking

  1. Schema Changes
    - Add `last_reset_at` column to `user_goals` table if it doesn't exist
  
  2. Functions Added
    - `column_exists()` - Utility function to check if a column exists
    - `get_todays_calories()` - Get calories consumed today for a user
    - `force_goals_refresh_now()` - Immediately force refresh goals
  
  3. Issues Fixed
    - Proper dropping and recreation of functions to avoid naming conflicts
    - Improved date/time filtering for accurate goal calculations
    - Proper permission grants for all functions
*/

-- Add a function to ensure column exists (diagnostic)
DROP FUNCTION IF EXISTS column_exists(text, text);
CREATE FUNCTION column_exists(
  table_name text,
  column_name text
) RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = $1 
      AND column_name = $2
  );
END;
$$;

-- First check and add last_reset_at column if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_goals' AND column_name = 'last_reset_at'
  ) THEN
    ALTER TABLE user_goals ADD COLUMN last_reset_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Drop existing functions that we will recreate
DROP FUNCTION IF EXISTS should_reset_goal(text, timestamptz);
DROP FUNCTION IF EXISTS refresh_all_goal_progress(uuid);
DROP FUNCTION IF EXISTS get_todays_calories(uuid);
DROP FUNCTION IF EXISTS force_goals_refresh_now(uuid);

-- Improved function to determine if a goal needs to be reset
CREATE FUNCTION should_reset_goal(
  goal_type text,
  last_reset_at timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  current_date_start timestamptz := date_trunc('day', now());
  current_week_start timestamptz := date_trunc('week', now());
  result boolean := false;
BEGIN
  -- Daily goals reset every day
  IF goal_type IN ('daily_calories', 'daily_protein', 'daily_carbs', 'daily_fats', 'daily_water') THEN
    -- Reset if last_reset is before the current day
    result := last_reset_at IS NULL OR last_reset_at < current_date_start;
  
  -- Weekly goals reset every week
  ELSIF goal_type IN ('weekly_workouts') THEN
    -- Reset if last_reset is before the current week
    result := last_reset_at IS NULL OR last_reset_at < current_week_start;
  
  -- For any other goal types, return false
  ELSE
    result := false;
  END IF;
  
  RETURN result;
END;
$$;

-- Create the refresh function with improved logic
CREATE FUNCTION refresh_all_goal_progress(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_date_start timestamptz := date_trunc('day', now());
    current_week_start timestamptz := date_trunc('week', now());
    current_week_end timestamptz := date_trunc('week', now()) + interval '6 days' + interval '23 hours 59 minutes 59 seconds';
    goal_record RECORD;
    daily_calories_sum numeric := 0;
    daily_protein_sum numeric := 0;
    daily_carbs_sum numeric := 0;
    daily_fats_sum numeric := 0;
    weekly_workouts_count integer := 0;
BEGIN
    -- Calculate daily sums from nutrition logs for the current day only
    SELECT
        COALESCE(SUM(calories), 0),
        COALESCE(SUM(protein), 0),
        COALESCE(SUM(carbs), 0),
        COALESCE(SUM(fats), 0)
    INTO
        daily_calories_sum,
        daily_protein_sum,
        daily_carbs_sum,
        daily_fats_sum
    FROM
        nutrition_logs
    WHERE
        user_id = target_user_id AND 
        recorded_at >= current_date_start AND
        recorded_at < (current_date_start + interval '1 day');

    -- Calculate weekly workouts count from fitness logs for current week only
    SELECT
        COALESCE(COUNT(*), 0)
    INTO
        weekly_workouts_count
    FROM
        fitness_logs
    WHERE
        user_id = target_user_id AND 
        recorded_at >= current_week_start AND
        recorded_at <= current_week_end;

    -- Process each daily goal
    FOR goal_record IN 
        SELECT * FROM user_goals
        WHERE user_id = target_user_id
        AND is_active = true
        AND goal_type IN ('daily_calories', 'daily_protein', 'daily_carbs', 'daily_fats')
    LOOP
        -- Check if the goal needs to be reset
        IF should_reset_goal(goal_record.goal_type, goal_record.last_reset_at) THEN
            -- Reset the goal for the new day
            UPDATE user_goals
            SET
                current_value = CASE goal_record.goal_type
                    WHEN 'daily_calories' THEN daily_calories_sum
                    WHEN 'daily_protein' THEN daily_protein_sum
                    WHEN 'daily_carbs' THEN daily_carbs_sum
                    WHEN 'daily_fats' THEN daily_fats_sum
                    ELSE 0
                END,
                last_reset_at = current_date_start,
                updated_at = now()
            WHERE id = goal_record.id;
        ELSE
            -- Just update the current value
            UPDATE user_goals
            SET
                current_value = CASE goal_record.goal_type
                    WHEN 'daily_calories' THEN daily_calories_sum
                    WHEN 'daily_protein' THEN daily_protein_sum
                    WHEN 'daily_carbs' THEN daily_carbs_sum
                    WHEN 'daily_fats' THEN daily_fats_sum
                    ELSE current_value
                END,
                updated_at = now()
            WHERE id = goal_record.id;
        END IF;
    END LOOP;

    -- Process each weekly goal
    FOR goal_record IN 
        SELECT * FROM user_goals
        WHERE user_id = target_user_id
        AND is_active = true
        AND goal_type = 'weekly_workouts'
    LOOP
        -- Check if the goal needs to be reset
        IF should_reset_goal(goal_record.goal_type, goal_record.last_reset_at) THEN
            -- Reset the goal for the new week
            UPDATE user_goals
            SET
                current_value = weekly_workouts_count,
                last_reset_at = current_week_start,
                updated_at = now()
            WHERE id = goal_record.id;
        ELSE
            -- Just update the current value
            UPDATE user_goals
            SET
                current_value = weekly_workouts_count,
                updated_at = now()
            WHERE id = goal_record.id;
        END IF;
    END LOOP;
END;
$$;

-- Create function to get today's calories directly
CREATE FUNCTION get_todays_calories(target_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_date_start timestamptz := date_trunc('day', now());
    total_calories numeric := 0;
BEGIN
    -- Get calories for today only
    SELECT
        COALESCE(SUM(calories), 0)
    INTO
        total_calories
    FROM
        nutrition_logs
    WHERE
        user_id = target_user_id AND 
        recorded_at >= current_date_start AND
        recorded_at < (current_date_start + interval '1 day');
        
    RETURN total_calories;
END;
$$;

-- Function to manually force goal refresh immediately
CREATE FUNCTION force_goals_refresh_now(target_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    todays_calories numeric := 0;
BEGIN
    -- First refresh all goals
    PERFORM refresh_all_goal_progress(target_user_id);
    
    -- Get today's calories
    SELECT get_todays_calories(target_user_id) INTO todays_calories;
    
    -- Update specific daily calories goal
    UPDATE user_goals
    SET
        current_value = todays_calories,
        updated_at = now()
    WHERE 
        user_id = target_user_id AND
        goal_type = 'daily_calories' AND
        is_active = true;
    
    RETURN todays_calories;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION column_exists(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION should_reset_goal(text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_all_goal_progress(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_todays_calories(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION force_goals_refresh_now(uuid) TO authenticated;