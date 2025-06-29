/*
  # Fix leaderboard RPC functions

  This migration creates the leaderboard RPC functions with proper table aliases
  to resolve column ambiguity issues, specifically for the calories_burned column.

  1. Functions Created
    - get_weekly_leaderboard(): Returns weekly leaderboard data
    - get_monthly_leaderboard(): Returns monthly leaderboard data  
    - get_all_time_leaderboard(): Returns all-time leaderboard data
    - get_user_leaderboard_position(): Returns user's rank and stats for a period

  2. Security
    - All functions are available to authenticated users
    - Functions use proper table aliases to avoid column ambiguity

  3. Scoring Algorithm
    - Base score from meals logged and workouts completed
    - Bonus points for active days
    - Weighted by calories logged and burned
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_weekly_leaderboard();
DROP FUNCTION IF EXISTS get_monthly_leaderboard();
DROP FUNCTION IF EXISTS get_all_time_leaderboard();
DROP FUNCTION IF EXISTS get_user_leaderboard_position(uuid, text);

-- Create the weekly leaderboard function
CREATE OR REPLACE FUNCTION get_weekly_leaderboard()
RETURNS TABLE (
  rank bigint,
  user_display text,
  meals_logged bigint,
  workouts_completed bigint,
  calories_logged numeric,
  calories_burned numeric,
  days_active bigint,
  total_score numeric
) SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH date_range AS (
    SELECT 
      CURRENT_DATE - INTERVAL '7 days' AS start_date,
      CURRENT_DATE AS end_date
  ),
  user_stats AS (
    SELECT 
      u.id as user_id,
      COALESCE(u.email, 'Anonymous User') as user_display,
      COALESCE(nutrition_stats.meals_logged, 0) as meals_logged,
      COALESCE(fitness_stats.workouts_completed, 0) as workouts_completed,
      COALESCE(nutrition_stats.calories_logged, 0) as calories_logged,
      COALESCE(fitness_stats.calories_burned, 0) as calories_burned,
      COALESCE(activity_stats.days_active, 0) as days_active
    FROM users u
    CROSS JOIN date_range dr
    LEFT JOIN (
      SELECT 
        nl.user_id,
        COUNT(*) as meals_logged,
        SUM(nl.calories) as calories_logged
      FROM nutrition_logs nl
      CROSS JOIN date_range dr2
      WHERE nl.recorded_at >= dr2.start_date 
        AND nl.recorded_at < dr2.end_date
      GROUP BY nl.user_id
    ) nutrition_stats ON u.id = nutrition_stats.user_id
    LEFT JOIN (
      SELECT 
        fl.user_id,
        COUNT(*) as workouts_completed,
        SUM(fl.calories_burned) as calories_burned
      FROM fitness_logs fl
      CROSS JOIN date_range dr3
      WHERE fl.recorded_at >= dr3.start_date 
        AND fl.recorded_at < dr3.end_date
      GROUP BY fl.user_id
    ) fitness_stats ON u.id = fitness_stats.user_id
    LEFT JOIN (
      SELECT 
        at.user_id,
        COUNT(DISTINCT DATE(at.created_at)) as days_active
      FROM activity_tracking at
      CROSS JOIN date_range dr4
      WHERE at.created_at >= dr4.start_date 
        AND at.created_at < dr4.end_date
      GROUP BY at.user_id
    ) activity_stats ON u.id = activity_stats.user_id
  ),
  scored_stats AS (
    SELECT 
      *,
      (
        (meals_logged * 10) + 
        (workouts_completed * 15) + 
        (days_active * 5) + 
        (calories_logged * 0.01) + 
        (calories_burned * 0.02)
      ) as total_score
    FROM user_stats
    WHERE meals_logged > 0 OR workouts_completed > 0 OR days_active > 0
  )
  SELECT 
    ROW_NUMBER() OVER (ORDER BY ss.total_score DESC) as rank,
    ss.user_display,
    ss.meals_logged,
    ss.workouts_completed,
    ss.calories_logged,
    ss.calories_burned,
    ss.days_active,
    ss.total_score
  FROM scored_stats ss
  ORDER BY ss.total_score DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql;

-- Create the monthly leaderboard function
CREATE OR REPLACE FUNCTION get_monthly_leaderboard()
RETURNS TABLE (
  rank bigint,
  user_display text,
  meals_logged bigint,
  workouts_completed bigint,
  calories_logged numeric,
  calories_burned numeric,
  days_active bigint,
  total_score numeric
) SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH date_range AS (
    SELECT 
      CURRENT_DATE - INTERVAL '30 days' AS start_date,
      CURRENT_DATE AS end_date
  ),
  user_stats AS (
    SELECT 
      u.id as user_id,
      COALESCE(u.email, 'Anonymous User') as user_display,
      COALESCE(nutrition_stats.meals_logged, 0) as meals_logged,
      COALESCE(fitness_stats.workouts_completed, 0) as workouts_completed,
      COALESCE(nutrition_stats.calories_logged, 0) as calories_logged,
      COALESCE(fitness_stats.calories_burned, 0) as calories_burned,
      COALESCE(activity_stats.days_active, 0) as days_active
    FROM users u
    CROSS JOIN date_range dr
    LEFT JOIN (
      SELECT 
        nl.user_id,
        COUNT(*) as meals_logged,
        SUM(nl.calories) as calories_logged
      FROM nutrition_logs nl
      CROSS JOIN date_range dr2
      WHERE nl.recorded_at >= dr2.start_date 
        AND nl.recorded_at < dr2.end_date
      GROUP BY nl.user_id
    ) nutrition_stats ON u.id = nutrition_stats.user_id
    LEFT JOIN (
      SELECT 
        fl.user_id,
        COUNT(*) as workouts_completed,
        SUM(fl.calories_burned) as calories_burned
      FROM fitness_logs fl
      CROSS JOIN date_range dr3
      WHERE fl.recorded_at >= dr3.start_date 
        AND fl.recorded_at < dr3.end_date
      GROUP BY fl.user_id
    ) fitness_stats ON u.id = fitness_stats.user_id
    LEFT JOIN (
      SELECT 
        at.user_id,
        COUNT(DISTINCT DATE(at.created_at)) as days_active
      FROM activity_tracking at
      CROSS JOIN date_range dr4
      WHERE at.created_at >= dr4.start_date 
        AND at.created_at < dr4.end_date
      GROUP BY at.user_id
    ) activity_stats ON u.id = activity_stats.user_id
  ),
  scored_stats AS (
    SELECT 
      *,
      (
        (meals_logged * 10) + 
        (workouts_completed * 15) + 
        (days_active * 5) + 
        (calories_logged * 0.01) + 
        (calories_burned * 0.02)
      ) as total_score
    FROM user_stats
    WHERE meals_logged > 0 OR workouts_completed > 0 OR days_active > 0
  )
  SELECT 
    ROW_NUMBER() OVER (ORDER BY ss.total_score DESC) as rank,
    ss.user_display,
    ss.meals_logged,
    ss.workouts_completed,
    ss.calories_logged,
    ss.calories_burned,
    ss.days_active,
    ss.total_score
  FROM scored_stats ss
  ORDER BY ss.total_score DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql;

-- Create the all-time leaderboard function
CREATE OR REPLACE FUNCTION get_all_time_leaderboard()
RETURNS TABLE (
  rank bigint,
  user_display text,
  meals_logged bigint,
  workouts_completed bigint,
  calories_logged numeric,
  calories_burned numeric,
  days_active bigint,
  total_score numeric
) SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      u.id as user_id,
      COALESCE(u.email, 'Anonymous User') as user_display,
      COALESCE(nutrition_stats.meals_logged, 0) as meals_logged,
      COALESCE(fitness_stats.workouts_completed, 0) as workouts_completed,
      COALESCE(nutrition_stats.calories_logged, 0) as calories_logged,
      COALESCE(fitness_stats.calories_burned, 0) as calories_burned,
      COALESCE(activity_stats.days_active, 0) as days_active
    FROM users u
    LEFT JOIN (
      SELECT 
        nl.user_id,
        COUNT(*) as meals_logged,
        SUM(nl.calories) as calories_logged
      FROM nutrition_logs nl
      GROUP BY nl.user_id
    ) nutrition_stats ON u.id = nutrition_stats.user_id
    LEFT JOIN (
      SELECT 
        fl.user_id,
        COUNT(*) as workouts_completed,
        SUM(fl.calories_burned) as calories_burned
      FROM fitness_logs fl
      GROUP BY fl.user_id
    ) fitness_stats ON u.id = fitness_stats.user_id
    LEFT JOIN (
      SELECT 
        at.user_id,
        COUNT(DISTINCT DATE(at.created_at)) as days_active
      FROM activity_tracking at
      GROUP BY at.user_id
    ) activity_stats ON u.id = activity_stats.user_id
  ),
  scored_stats AS (
    SELECT 
      *,
      (
        (meals_logged * 10) + 
        (workouts_completed * 15) + 
        (days_active * 5) + 
        (calories_logged * 0.01) + 
        (calories_burned * 0.02)
      ) as total_score
    FROM user_stats
    WHERE meals_logged > 0 OR workouts_completed > 0 OR days_active > 0
  )
  SELECT 
    ROW_NUMBER() OVER (ORDER BY ss.total_score DESC) as rank,
    ss.user_display,
    ss.meals_logged,
    ss.workouts_completed,
    ss.calories_logged,
    ss.calories_burned,
    ss.days_active,
    ss.total_score
  FROM scored_stats ss
  ORDER BY ss.total_score DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql;

-- Create the user leaderboard position function
CREATE OR REPLACE FUNCTION get_user_leaderboard_position(
  target_user_id uuid,
  period text DEFAULT 'weekly'
)
RETURNS TABLE (
  user_rank bigint,
  total_users bigint,
  meals_logged bigint,
  workouts_completed bigint,
  calories_logged numeric,
  calories_burned numeric,
  days_active bigint,
  total_score numeric
) SECURITY DEFINER
AS $$
DECLARE
  start_date_val date;
  end_date_val date;
BEGIN
  -- Set date range based on period
  IF period = 'weekly' THEN
    start_date_val := CURRENT_DATE - INTERVAL '7 days';
    end_date_val := CURRENT_DATE;
  ELSIF period = 'monthly' THEN
    start_date_val := CURRENT_DATE - INTERVAL '30 days';
    end_date_val := CURRENT_DATE;
  ELSE -- all_time
    start_date_val := '1900-01-01'::date;
    end_date_val := CURRENT_DATE;
  END IF;

  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      u.id as user_id,
      COALESCE(nutrition_stats.meals_logged, 0) as meals_logged,
      COALESCE(fitness_stats.workouts_completed, 0) as workouts_completed,
      COALESCE(nutrition_stats.calories_logged, 0) as calories_logged,
      COALESCE(fitness_stats.calories_burned, 0) as calories_burned,
      COALESCE(activity_stats.days_active, 0) as days_active
    FROM users u
    LEFT JOIN (
      SELECT 
        nl.user_id,
        COUNT(*) as meals_logged,
        SUM(nl.calories) as calories_logged
      FROM nutrition_logs nl
      WHERE nl.recorded_at >= start_date_val 
        AND nl.recorded_at < end_date_val
      GROUP BY nl.user_id
    ) nutrition_stats ON u.id = nutrition_stats.user_id
    LEFT JOIN (
      SELECT 
        fl.user_id,
        COUNT(*) as workouts_completed,
        SUM(fl.calories_burned) as calories_burned
      FROM fitness_logs fl
      WHERE fl.recorded_at >= start_date_val 
        AND fl.recorded_at < end_date_val
      GROUP BY fl.user_id
    ) fitness_stats ON u.id = fitness_stats.user_id
    LEFT JOIN (
      SELECT 
        at.user_id,
        COUNT(DISTINCT DATE(at.created_at)) as days_active
      FROM activity_tracking at
      WHERE at.created_at >= start_date_val 
        AND at.created_at < end_date_val
      GROUP BY at.user_id
    ) activity_stats ON u.id = activity_stats.user_id
  ),
  scored_stats AS (
    SELECT 
      *,
      (
        (meals_logged * 10) + 
        (workouts_completed * 15) + 
        (days_active * 5) + 
        (calories_logged * 0.01) + 
        (calories_burned * 0.02)
      ) as total_score
    FROM user_stats
  ),
  ranked_stats AS (
    SELECT 
      *,
      ROW_NUMBER() OVER (ORDER BY total_score DESC) as rank
    FROM scored_stats
    WHERE meals_logged > 0 OR workouts_completed > 0 OR days_active > 0
  ),
  total_count AS (
    SELECT COUNT(*) as total_users FROM ranked_stats
  )
  SELECT 
    COALESCE(rs.rank, 0) as user_rank,
    tc.total_users,
    COALESCE(rs.meals_logged, 0) as meals_logged,
    COALESCE(rs.workouts_completed, 0) as workouts_completed,
    COALESCE(rs.calories_logged, 0) as calories_logged,
    COALESCE(rs.calories_burned, 0) as calories_burned,
    COALESCE(rs.days_active, 0) as days_active,
    COALESCE(rs.total_score, 0) as total_score
  FROM total_count tc
  LEFT JOIN ranked_stats rs ON rs.user_id = target_user_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_weekly_leaderboard() TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_leaderboard() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_time_leaderboard() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_leaderboard_position(uuid, text) TO authenticated;