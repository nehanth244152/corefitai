-- First, drop the triggers that depend on the function
DROP TRIGGER IF EXISTS update_nutrition_goal_progress ON nutrition_logs;
DROP TRIGGER IF EXISTS update_fitness_goal_progress ON fitness_logs;

-- Now, drop the functions
DROP FUNCTION IF EXISTS should_reset_goal(text, timestamp with time zone);
DROP FUNCTION IF EXISTS refresh_all_goal_progress(uuid);
DROP FUNCTION IF EXISTS update_goal_progress();
DROP FUNCTION IF EXISTS force_reset_all_goals(uuid);

-- Improved function to determine if a goal needs to be reset
CREATE OR REPLACE FUNCTION should_reset_goal(
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
    result := last_reset_at < current_date_start;
  
  -- Weekly goals reset every week
  ELSIF goal_type IN ('weekly_workouts') THEN
    -- Reset if last_reset is before the current week
    result := last_reset_at < current_week_start;
  
  -- For any other goal types, return false
  ELSE
    result := false;
  END IF;
  
  RETURN result;
END;
$$;

-- Enhanced function to reset all goals for a user with proper timestamp handling
CREATE OR REPLACE FUNCTION refresh_all_goal_progress(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_date_start timestamp with time zone := date_trunc('day', now());
    current_week_start timestamp with time zone := date_trunc('week', now());
    current_week_end timestamp with time zone := date_trunc('week', now()) + interval '6 days';
    goal_record RECORD;
    daily_calories_sum numeric := 0;
    daily_protein_sum numeric := 0;
    daily_carbs_sum numeric := 0;
    daily_fats_sum numeric := 0;
    weekly_workouts_count integer := 0;
BEGIN
    -- Calculate daily sums from nutrition logs for the current day
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
        user_id = target_user_id AND date_trunc('day', recorded_at) = current_date_start;

    -- Calculate weekly workouts count from fitness logs for the current week
    SELECT
        COALESCE(COUNT(*), 0)
    INTO
        weekly_workouts_count
    FROM
        fitness_logs
    WHERE
        user_id = target_user_id 
        AND recorded_at >= current_week_start 
        AND recorded_at <= (current_week_end + interval '23 hours 59 minutes 59 seconds');

    -- Process each daily goal
    FOR goal_record IN 
        SELECT * FROM user_goals
        WHERE user_id = target_user_id
        AND is_active = true
        AND goal_type IN ('daily_calories', 'daily_protein', 'daily_carbs', 'daily_fats')
    LOOP
        -- Check if the goal needs to be reset
        IF goal_record.last_reset_at IS NULL OR goal_record.last_reset_at < current_date_start THEN
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
        IF goal_record.last_reset_at IS NULL OR goal_record.last_reset_at < current_week_start THEN
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

-- Fix the update_goal_progress trigger function
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS trigger AS $$
DECLARE
  goal_record RECORD;
  current_date_start timestamp with time zone := date_trunc('day', now());
  current_week_start timestamp with time zone := date_trunc('week', now());
  current_week_end timestamp with time zone := date_trunc('week', now()) + interval '6 days';
BEGIN
  -- When a nutrition log is added or updated
  IF TG_TABLE_NAME = 'nutrition_logs' THEN
    -- For each active daily goal
    FOR goal_record IN 
      SELECT * FROM user_goals 
      WHERE user_id = NEW.user_id 
      AND goal_type IN ('daily_calories', 'daily_protein', 'daily_carbs', 'daily_fats')
      AND is_active = true
    LOOP
      -- Check if goal needs to be reset
      IF goal_record.last_reset_at IS NULL OR goal_record.last_reset_at < current_date_start THEN
        -- Reset the goal for the new day
        UPDATE user_goals 
        SET 
          current_value = CASE goal_record.goal_type
            WHEN 'daily_calories' THEN (
              SELECT COALESCE(SUM(calories), 0) 
              FROM nutrition_logs 
              WHERE user_id = NEW.user_id 
              AND date_trunc('day', recorded_at) = current_date_start
            )
            WHEN 'daily_protein' THEN (
              SELECT COALESCE(SUM(protein), 0) 
              FROM nutrition_logs 
              WHERE user_id = NEW.user_id 
              AND date_trunc('day', recorded_at) = current_date_start
            )
            WHEN 'daily_carbs' THEN (
              SELECT COALESCE(SUM(carbs), 0) 
              FROM nutrition_logs 
              WHERE user_id = NEW.user_id 
              AND date_trunc('day', recorded_at) = current_date_start
            )
            WHEN 'daily_fats' THEN (
              SELECT COALESCE(SUM(fats), 0) 
              FROM nutrition_logs 
              WHERE user_id = NEW.user_id 
              AND date_trunc('day', recorded_at) = current_date_start
            )
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
            WHEN 'daily_calories' THEN (
              SELECT COALESCE(SUM(calories), 0) 
              FROM nutrition_logs 
              WHERE user_id = NEW.user_id 
              AND date_trunc('day', recorded_at) = current_date_start
            )
            WHEN 'daily_protein' THEN (
              SELECT COALESCE(SUM(protein), 0) 
              FROM nutrition_logs 
              WHERE user_id = NEW.user_id 
              AND date_trunc('day', recorded_at) = current_date_start
            )
            WHEN 'daily_carbs' THEN (
              SELECT COALESCE(SUM(carbs), 0) 
              FROM nutrition_logs 
              WHERE user_id = NEW.user_id 
              AND date_trunc('day', recorded_at) = current_date_start
            )
            WHEN 'daily_fats' THEN (
              SELECT COALESCE(SUM(fats), 0) 
              FROM nutrition_logs 
              WHERE user_id = NEW.user_id 
              AND date_trunc('day', recorded_at) = current_date_start
            )
            ELSE current_value
          END,
          updated_at = now()
        WHERE id = goal_record.id;
      END IF;
    END LOOP;
  END IF;
  
  -- When a fitness log is added or updated
  IF TG_TABLE_NAME = 'fitness_logs' THEN
    -- For each active weekly goal
    FOR goal_record IN 
      SELECT * FROM user_goals 
      WHERE user_id = NEW.user_id 
      AND goal_type = 'weekly_workouts'
      AND is_active = true
    LOOP
      -- Check if goal needs to be reset
      IF goal_record.last_reset_at IS NULL OR goal_record.last_reset_at < current_week_start THEN
        -- Reset the goal for the new week
        UPDATE user_goals 
        SET 
          current_value = (
            SELECT COUNT(*) 
            FROM fitness_logs 
            WHERE user_id = NEW.user_id 
            AND recorded_at >= current_week_start
            AND recorded_at <= (current_week_end + interval '23 hours 59 minutes 59 seconds')
          ),
          last_reset_at = current_week_start,
          updated_at = now()
        WHERE id = goal_record.id;
      ELSE
        -- Just update the current value
        UPDATE user_goals 
        SET 
          current_value = (
            SELECT COUNT(*) 
            FROM fitness_logs 
            WHERE user_id = NEW.user_id 
            AND recorded_at >= current_week_start
            AND recorded_at <= (current_week_end + interval '23 hours 59 minutes 59 seconds')
          ),
          updated_at = now()
        WHERE id = goal_record.id;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a function to manually force reset of all goals for testing
CREATE OR REPLACE FUNCTION force_reset_all_goals(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_date_start timestamp with time zone := date_trunc('day', now());
  current_week_start timestamp with time zone := date_trunc('week', now());
BEGIN
  -- Reset all daily goals
  UPDATE user_goals
  SET 
    current_value = 0,
    last_reset_at = current_date_start - interval '1 day', -- Force reset by setting to yesterday
    updated_at = now()
  WHERE user_id = target_user_id
  AND goal_type IN ('daily_calories', 'daily_protein', 'daily_carbs', 'daily_fats')
  AND is_active = true;
  
  -- Reset all weekly goals
  UPDATE user_goals
  SET 
    current_value = 0,
    last_reset_at = current_week_start - interval '1 week', -- Force reset by setting to last week
    updated_at = now()
  WHERE user_id = target_user_id
  AND goal_type = 'weekly_workouts'
  AND is_active = true;
  
  -- Now refresh the actual progress after reset
  PERFORM refresh_all_goal_progress(target_user_id);
END;
$$;

-- Recreate the triggers
CREATE TRIGGER update_nutrition_goal_progress
  AFTER INSERT OR UPDATE ON nutrition_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_progress();

CREATE TRIGGER update_fitness_goal_progress
  AFTER INSERT OR UPDATE ON fitness_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_progress();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION should_reset_goal(text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_all_goal_progress(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_goal_progress() TO authenticated;
GRANT EXECUTE ON FUNCTION force_reset_all_goals(uuid) TO authenticated;

-- Add comments
COMMENT ON FUNCTION should_reset_goal(text, timestamptz) IS 'Determines if a goal should be reset based on its type and last reset time';
COMMENT ON FUNCTION refresh_all_goal_progress(uuid) IS 'Refreshes a user''s goal progress and handles automatic resets for daily and weekly goals';
COMMENT ON FUNCTION update_goal_progress() IS 'Trigger function to update goal progress when nutrition or fitness logs are added or updated';
COMMENT ON FUNCTION force_reset_all_goals(uuid) IS 'Function to manually force reset all goals for a user (for testing)';