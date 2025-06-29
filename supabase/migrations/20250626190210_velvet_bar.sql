/*
  # Add refresh_all_goal_progress function

  1. New Functions
    - `refresh_all_goal_progress(target_user_id uuid)` - Calculates and updates user goal progress based on current nutrition and fitness data

  2. Function Details
    - Calculates daily nutrition sums (calories, protein, carbs, fats) for current day
    - Calculates weekly workout count for current week
    - Updates user goals with current progress values
    - Handles daily and weekly resets automatically
    - Grants execution permissions to authenticated users

  3. Security
    - Function uses SECURITY DEFINER for proper access control
    - Granted execution permissions to authenticated role
*/

CREATE OR REPLACE FUNCTION public.refresh_all_goal_progress(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_day date := current_date;
    start_of_week date := date_trunc('week', current_date)::date;
    end_of_week date := (date_trunc('week', current_date) + interval '6 days')::date;
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

    -- Update daily goals
    UPDATE user_goals
    SET
        current_value = CASE goal_type
            WHEN 'daily_calories' THEN daily_calories_sum
            WHEN 'daily_protein' THEN daily_protein_sum
            WHEN 'daily_carbs' THEN daily_carbs_sum
            WHEN 'daily_fats' THEN daily_fats_sum
            ELSE current_value
        END,
        updated_at = now()
    WHERE
        user_id = target_user_id
        AND goal_type IN ('daily_calories', 'daily_protein', 'daily_carbs', 'daily_fats')
        AND (
            -- Reset if last update was before current day (new day started)
            updated_at::date < current_day
            -- Or if the goal was just created today and needs initial value
            OR created_at::date = current_day
            -- Or if the current value is less than the new calculated sum (i.e., new data logged)
            OR current_value < CASE goal_type
                WHEN 'daily_calories' THEN daily_calories_sum
                WHEN 'daily_protein' THEN daily_protein_sum
                WHEN 'daily_carbs' THEN daily_carbs_sum
                WHEN 'daily_fats' THEN daily_fats_sum
                ELSE current_value
            END
        );

    -- Update weekly workouts goal
    UPDATE user_goals
    SET
        current_value = weekly_workouts_count,
        updated_at = now()
    WHERE
        user_id = target_user_id
        AND goal_type = 'weekly_workouts'
        AND (
            -- Reset if last update was before current week (new week started)
            updated_at::date < start_of_week
            -- Or if the goal was just created this week and needs initial value
            OR created_at::date BETWEEN start_of_week AND end_of_week
            -- Or if the current value is less than the new calculated count (i.e., new workout logged)
            OR current_value < weekly_workouts_count
        );

END;
$$;

-- Grant execution permissions to the authenticated role
GRANT EXECUTE ON FUNCTION public.refresh_all_goal_progress(uuid) TO authenticated;