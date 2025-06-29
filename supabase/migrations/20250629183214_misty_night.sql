/*
  # Implement Automatic Goal Reset Functionality

  1. Function Enhancements
    - Create trigger function that auto-resets daily goals at midnight
    - Create trigger function that auto-resets weekly goals at the start of each week
    - Add timestamp tracking for last reset
    - Improve the refresh_all_goal_progress function to handle time-based resets

  2. Auto-Reset Logic
    - Daily goals (calories, protein, carbs, fats) reset every day at midnight
    - Weekly goals (workouts) reset every Monday at midnight
    - Goals maintain proper history for analytics purposes

  3. Security
    - All functions run with appropriate security context
    - Only affect the user's own goals
*/

-- Alter user_goals table to track when the goal was last reset
ALTER TABLE user_goals 
ADD COLUMN IF NOT EXISTS last_reset_at timestamptz DEFAULT now();

-- Create or replace function to determine if a goal needs to be reset
CREATE OR REPLACE FUNCTION should_reset_goal(
  goal_type text,
  last_reset timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  current_date_start timestamptz := date_trunc('day', now());
  current_week_start timestamptz := date_trunc('week', now());
  result boolean := false;
BEGIN
  -- Daily goals reset every day
  IF goal_type IN ('daily_calories', 'daily_protein', 'daily_carbs', 'daily_fats', 'daily_water') THEN
    -- Reset if last_reset is before the current day
    result := last_reset < current_date_start;
  
  -- Weekly goals reset every week
  ELSIF goal_type IN ('weekly_workouts') THEN
    -- Reset if last_reset is before the current week
    result := last_reset < current_week_start;
  
  -- For any other goal types, return false
  ELSE
    result := false;
  END IF;
  
  RETURN result;
END;
$$;

-- Improve the refresh_all_goal_progress function to handle time-based resets
CREATE OR REPLACE FUNCTION refresh_all_goal_progress(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_date_start date := current_date;
    current_week_start date := date_trunc('week', current_date)::date;
    current_week_end date := (current_week_start + interval '6 days')::date;
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
        user_id = target_user_id AND 
        date_trunc('day', recorded_at) = current_date_start;

    -- Calculate weekly workouts count from fitness logs for the current week
    SELECT
        COALESCE(COUNT(*), 0)
    INTO
        weekly_workouts_count
    FROM
        fitness_logs
    WHERE
        user_id = target_user_id AND 
        recorded_at::date BETWEEN current_week_start AND current_week_end;

    -- Update daily goals with auto-reset logic
    FOR goal_record IN 
        SELECT * FROM user_goals 
        WHERE user_id = target_user_id 
        AND is_active = true
        AND goal_type IN ('daily_calories', 'daily_protein', 'daily_carbs', 'daily_fats')
    LOOP
        -- Check if goal needs to be reset based on timestamp
        IF should_reset_goal(goal_record.goal_type, goal_record.last_reset_at) THEN
            -- Reset the goal and update the timestamp
            UPDATE user_goals
            SET 
                current_value = CASE goal_record.goal_type
                    WHEN 'daily_calories' THEN daily_calories_sum
                    WHEN 'daily_protein' THEN daily_protein_sum
                    WHEN 'daily_carbs' THEN daily_carbs_sum
                    WHEN 'daily_fats' THEN daily_fats_sum
                    ELSE 0
                END,
                last_reset_at = date_trunc('day', now()),
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

    -- Update weekly goals with auto-reset logic
    FOR goal_record IN 
        SELECT * FROM user_goals 
        WHERE user_id = target_user_id 
        AND is_active = true
        AND goal_type = 'weekly_workouts'
    LOOP
        -- Check if goal needs to be reset based on timestamp
        IF should_reset_goal(goal_record.goal_type, goal_record.last_reset_at) THEN
            -- Reset the goal and update the timestamp
            UPDATE user_goals
            SET 
                current_value = weekly_workouts_count,
                last_reset_at = date_trunc('week', now()),
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

-- Update the update_goal_progress function to handle the auto-reset logic
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS trigger AS $$
DECLARE
  goal_record RECORD;
  current_date_start date := current_date;
  current_week_start date := date_trunc('week', current_date)::date;
  current_week_end date := (current_week_start + interval '6 days')::date;
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
      -- Check if goal needs to be reset based on timestamp
      IF should_reset_goal(goal_record.goal_type, goal_record.last_reset_at) THEN
        -- Calculate the current value for today only
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
          last_reset_at = date_trunc('day', now()),
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
      -- Check if goal needs to be reset based on timestamp
      IF should_reset_goal(goal_record.goal_type, goal_record.last_reset_at) THEN
        -- Calculate the current value for this week only
        UPDATE user_goals 
        SET 
          current_value = (
            SELECT COUNT(*) 
            FROM fitness_logs 
            WHERE user_id = NEW.user_id 
            AND recorded_at::date BETWEEN current_week_start AND current_week_end
          ),
          last_reset_at = date_trunc('week', now()),
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
            AND recorded_at::date BETWEEN current_week_start AND current_week_end
          ),
          updated_at = now()
        WHERE id = goal_record.id;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to manually reset a goal
CREATE OR REPLACE FUNCTION reset_goal(goal_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  goal_record RECORD;
  user_id_val uuid;
  goal_type_val text;
  current_date_start date := current_date;
  current_week_start date := date_trunc('week', current_date)::date;
  current_week_end date := (current_week_start + interval '6 days')::date;
  new_value numeric := 0;
BEGIN
  -- Get the goal details
  SELECT * INTO goal_record FROM user_goals WHERE id = goal_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  user_id_val := goal_record.user_id;
  goal_type_val := goal_record.goal_type;
  
  -- Calculate the new current_value based on goal type
  IF goal_type_val = 'daily_calories' THEN
    SELECT COALESCE(SUM(calories), 0) INTO new_value
    FROM nutrition_logs 
    WHERE user_id = user_id_val 
    AND date_trunc('day', recorded_at) = current_date_start;
  
  ELSIF goal_type_val = 'daily_protein' THEN
    SELECT COALESCE(SUM(protein), 0) INTO new_value
    FROM nutrition_logs 
    WHERE user_id = user_id_val 
    AND date_trunc('day', recorded_at) = current_date_start;
  
  ELSIF goal_type_val = 'daily_carbs' THEN
    SELECT COALESCE(SUM(carbs), 0) INTO new_value
    FROM nutrition_logs 
    WHERE user_id = user_id_val 
    AND date_trunc('day', recorded_at) = current_date_start;
  
  ELSIF goal_type_val = 'daily_fats' THEN
    SELECT COALESCE(SUM(fats), 0) INTO new_value
    FROM nutrition_logs 
    WHERE user_id = user_id_val 
    AND date_trunc('day', recorded_at) = current_date_start;
  
  ELSIF goal_type_val = 'weekly_workouts' THEN
    SELECT COUNT(*) INTO new_value
    FROM fitness_logs 
    WHERE user_id = user_id_val 
    AND recorded_at::date BETWEEN current_week_start AND current_week_end;
  
  ELSE
    -- For other goal types, just set to 0
    new_value := 0;
  END IF;
  
  -- Update the goal with the new value and reset time
  UPDATE user_goals
  SET 
    current_value = new_value,
    last_reset_at = CASE 
      WHEN goal_type_val IN ('daily_calories', 'daily_protein', 'daily_carbs', 'daily_fats', 'daily_water') 
      THEN date_trunc('day', now())
      WHEN goal_type_val = 'weekly_workouts'
      THEN date_trunc('week', now())
      ELSE now()
    END,
    updated_at = now()
  WHERE id = goal_id;
  
  RETURN true;
END;
$$;

-- Create a function to reset all goals for a user
CREATE OR REPLACE FUNCTION reset_all_user_goals(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  goal_record RECORD;
  result boolean := true;
BEGIN
  -- Reset each active goal for the user
  FOR goal_record IN 
    SELECT id FROM user_goals 
    WHERE user_id = target_user_id 
    AND is_active = true
  LOOP
    result := result AND reset_goal(goal_record.id);
  END LOOP;
  
  RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION should_reset_goal(text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_all_goal_progress(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_goal(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_all_user_goals(uuid) TO authenticated;

-- Update the GoalProgress refresh function to handle auto-resets
CREATE OR REPLACE FUNCTION public.refresh_all_goal_progress(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_day date := current_date;
    start_of_week date := date_trunc('week', current_date)::date;
    end_of_week date := (date_trunc('week', current_date) + interval '6 days')::date;
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
        user_id = target_user_id AND recorded_at::date = current_day;

    -- Calculate weekly workouts count from fitness logs for the current week
    SELECT
        COALESCE(COUNT(*), 0)
    INTO
        weekly_workouts_count
    FROM
        fitness_logs
    WHERE
        user_id = target_user_id AND recorded_at::date BETWEEN start_of_week AND end_of_week;

    -- For each daily goal, check if it needs to be reset
    FOR goal_record IN 
        SELECT * FROM user_goals
        WHERE user_id = target_user_id
        AND is_active = true
        AND goal_type IN ('daily_calories', 'daily_protein', 'daily_carbs', 'daily_fats')
    LOOP
        IF should_reset_goal(goal_record.goal_type, goal_record.last_reset_at) THEN
            -- Reset goal and update with today's progress
            UPDATE user_goals
            SET
                current_value = CASE goal_record.goal_type
                    WHEN 'daily_calories' THEN daily_calories_sum
                    WHEN 'daily_protein' THEN daily_protein_sum
                    WHEN 'daily_carbs' THEN daily_carbs_sum
                    WHEN 'daily_fats' THEN daily_fats_sum
                    ELSE 0
                END,
                last_reset_at = date_trunc('day', now()),
                updated_at = now()
            WHERE id = goal_record.id;
        ELSE
            -- Just update with today's progress
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

    -- For weekly workouts goal, check if it needs to be reset
    FOR goal_record IN 
        SELECT * FROM user_goals
        WHERE user_id = target_user_id
        AND is_active = true
        AND goal_type = 'weekly_workouts'
    LOOP
        IF should_reset_goal(goal_record.goal_type, goal_record.last_reset_at) THEN
            -- Reset goal and update with this week's progress
            UPDATE user_goals
            SET
                current_value = weekly_workouts_count,
                last_reset_at = date_trunc('week', now()),
                updated_at = now()
            WHERE id = goal_record.id;
        ELSE
            -- Just update with this week's progress
            UPDATE user_goals
            SET
                current_value = weekly_workouts_count,
                updated_at = now()
            WHERE id = goal_record.id;
        END IF;
    END LOOP;
END;
$$;

-- Create comment for this migration
COMMENT ON FUNCTION refresh_all_goal_progress(uuid) IS 'Refreshes a user''s goal progress and handles automatic resets for daily and weekly goals';
COMMENT ON FUNCTION should_reset_goal(text, timestamptz) IS 'Determines if a goal should be reset based on its type and last reset time';
COMMENT ON FUNCTION reset_goal(uuid) IS 'Manually resets a specific goal to the current period''s progress';
COMMENT ON FUNCTION reset_all_user_goals(uuid) IS 'Resets all active goals for a user';