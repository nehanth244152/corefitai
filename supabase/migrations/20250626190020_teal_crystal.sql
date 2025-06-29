/*
  # Add goal reset functionality

  1. New Functions
    - `reset_daily_goals()` - Resets all daily goals to current day's values
    - `reset_weekly_goals()` - Resets all weekly goals to current week's values
    - `refresh_all_goal_progress()` - Refreshes all goal progress for a user

  2. Enhanced Triggers
    - Update existing goal progress function to handle resets properly
    - Ensure goals are properly calculated for current time periods
*/

-- Function to reset daily goals based on current date
CREATE OR REPLACE FUNCTION reset_daily_goals(target_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Reset daily calories
  UPDATE user_goals 
  SET current_value = (
    SELECT COALESCE(SUM(calories), 0) 
    FROM nutrition_logs 
    WHERE user_id = target_user_id 
    AND DATE(recorded_at) = CURRENT_DATE
  )
  WHERE user_id = target_user_id 
  AND goal_type = 'daily_calories' 
  AND is_active = true;

  -- Reset daily protein
  UPDATE user_goals 
  SET current_value = (
    SELECT COALESCE(SUM(protein), 0) 
    FROM nutrition_logs 
    WHERE user_id = target_user_id 
    AND DATE(recorded_at) = CURRENT_DATE
  )
  WHERE user_id = target_user_id 
  AND goal_type = 'daily_protein' 
  AND is_active = true;

  -- Reset daily carbs
  UPDATE user_goals 
  SET current_value = (
    SELECT COALESCE(SUM(carbs), 0) 
    FROM nutrition_logs 
    WHERE user_id = target_user_id 
    AND DATE(recorded_at) = CURRENT_DATE
  )
  WHERE user_id = target_user_id 
  AND goal_type = 'daily_carbs' 
  AND is_active = true;

  -- Reset daily fats
  UPDATE user_goals 
  SET current_value = (
    SELECT COALESCE(SUM(fats), 0) 
    FROM nutrition_logs 
    WHERE user_id = target_user_id 
    AND DATE(recorded_at) = CURRENT_DATE
  )
  WHERE user_id = target_user_id 
  AND goal_type = 'daily_fats' 
  AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset weekly goals based on current week
CREATE OR REPLACE FUNCTION reset_weekly_goals(target_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Reset weekly workouts (week starts on Monday)
  UPDATE user_goals 
  SET current_value = (
    SELECT COUNT(*) 
    FROM fitness_logs 
    WHERE user_id = target_user_id 
    AND recorded_at >= DATE_TRUNC('week', CURRENT_DATE)
    AND recorded_at < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
  )
  WHERE user_id = target_user_id 
  AND goal_type = 'weekly_workouts' 
  AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh all goal progress for a user
CREATE OR REPLACE FUNCTION refresh_all_goal_progress(target_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Refresh daily goals
  PERFORM reset_daily_goals(target_user_id);
  
  -- Refresh weekly goals
  PERFORM reset_weekly_goals(target_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced goal progress update function
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION reset_daily_goals(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_weekly_goals(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_all_goal_progress(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_goal_progress() TO authenticated;