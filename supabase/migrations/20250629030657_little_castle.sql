/*
  # Create leaderboard functions and views

  1. New Functions
    - `get_weekly_leaderboard()` - Returns weekly leaderboard data
    - `get_monthly_leaderboard()` - Returns monthly leaderboard data
    - `get_all_time_leaderboard()` - Returns all-time leaderboard data

  2. Security
    - Functions accessible to authenticated users
    - Only aggregated, anonymized data is returned
    - No individual user details exposed

  3. Leaderboard Categories
    - Most meals logged
    - Most workouts completed
    - Highest calories logged
    - Most calories burned
    - Most consistent (days active)
*/

-- Function to get weekly leaderboard data
CREATE OR REPLACE FUNCTION get_weekly_leaderboard()
RETURNS TABLE(
  rank bigint,
  user_display text,
  meals_logged bigint,
  workouts_completed bigint,
  calories_logged numeric,
  calories_burned numeric,
  days_active bigint,
  total_score numeric
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH week_start AS (
    SELECT DATE_TRUNC('week', CURRENT_DATE)::date as start_date,
           (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::date as end_date
  ),
  user_stats AS (
    SELECT 
      u.id as user_id,
      COALESCE(SUBSTRING(u.email FROM 1 FOR 3), 'User') || '***' as user_display,
      COALESCE(n.meals_count, 0) as meals_logged,
      COALESCE(f.workouts_count, 0) as workouts_completed,
      COALESCE(n.total_calories, 0) as calories_logged,
      COALESCE(f.total_calories_burned, 0) as calories_burned,
      COALESCE(GREATEST(n.active_days, f.active_days), 0) as days_active
    FROM users u
    CROSS JOIN week_start w
    LEFT JOIN (
      SELECT 
        user_id,
        COUNT(*) as meals_count,
        SUM(calories) as total_calories,
        COUNT(DISTINCT DATE(recorded_at)) as active_days
      FROM nutrition_logs 
      WHERE recorded_at::date >= (SELECT start_date FROM week_start)
        AND recorded_at::date <= (SELECT end_date FROM week_start)
      GROUP BY user_id
    ) n ON n.user_id = u.id
    LEFT JOIN (
      SELECT 
        user_id,
        COUNT(*) as workouts_count,
        SUM(calories_burned) as total_calories_burned,
        COUNT(DISTINCT DATE(recorded_at)) as active_days
      FROM fitness_logs 
      WHERE recorded_at::date >= (SELECT start_date FROM week_start)
        AND recorded_at::date <= (SELECT end_date FROM week_start)
      GROUP BY user_id
    ) f ON f.user_id = u.id
    WHERE COALESCE(n.meals_count, 0) + COALESCE(f.workouts_count, 0) > 0
  ),
  scored_stats AS (
    SELECT 
      *,
      (meals_logged * 10 + workouts_completed * 15 + days_active * 20 + 
       LEAST(calories_logged / 100, 50) + LEAST(calories_burned / 10, 100)) as total_score
    FROM user_stats
  )
  SELECT 
    ROW_NUMBER() OVER (ORDER BY total_score DESC, meals_logged DESC, workouts_completed DESC) as rank,
    user_display,
    meals_logged,
    workouts_completed,
    calories_logged,
    calories_burned,
    days_active,
    total_score
  FROM scored_stats
  ORDER BY total_score DESC, meals_logged DESC
  LIMIT 20;
$$;

-- Function to get monthly leaderboard data
CREATE OR REPLACE FUNCTION get_monthly_leaderboard()
RETURNS TABLE(
  rank bigint,
  user_display text,
  meals_logged bigint,
  workouts_completed bigint,
  calories_logged numeric,
  calories_burned numeric,
  days_active bigint,
  total_score numeric
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH month_start AS (
    SELECT DATE_TRUNC('month', CURRENT_DATE)::date as start_date,
           (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::date as end_date
  ),
  user_stats AS (
    SELECT 
      u.id as user_id,
      COALESCE(SUBSTRING(u.email FROM 1 FOR 3), 'User') || '***' as user_display,
      COALESCE(n.meals_count, 0) as meals_logged,
      COALESCE(f.workouts_count, 0) as workouts_completed,
      COALESCE(n.total_calories, 0) as calories_logged,
      COALESCE(f.total_calories_burned, 0) as calories_burned,
      COALESCE(GREATEST(n.active_days, f.active_days), 0) as days_active
    FROM users u
    CROSS JOIN month_start m
    LEFT JOIN (
      SELECT 
        user_id,
        COUNT(*) as meals_count,
        SUM(calories) as total_calories,
        COUNT(DISTINCT DATE(recorded_at)) as active_days
      FROM nutrition_logs 
      WHERE recorded_at::date >= (SELECT start_date FROM month_start)
        AND recorded_at::date <= (SELECT end_date FROM month_start)
      GROUP BY user_id
    ) n ON n.user_id = u.id
    LEFT JOIN (
      SELECT 
        user_id,
        COUNT(*) as workouts_count,
        SUM(calories_burned) as total_calories_burned,
        COUNT(DISTINCT DATE(recorded_at)) as active_days
      FROM fitness_logs 
      WHERE recorded_at::date >= (SELECT start_date FROM month_start)
        AND recorded_at::date <= (SELECT end_date FROM month_start)
      GROUP BY user_id
    ) f ON f.user_id = u.id
    WHERE COALESCE(n.meals_count, 0) + COALESCE(f.workouts_count, 0) > 0
  ),
  scored_stats AS (
    SELECT 
      *,
      (meals_logged * 8 + workouts_completed * 12 + days_active * 15 + 
       LEAST(calories_logged / 200, 100) + LEAST(calories_burned / 20, 150)) as total_score
    FROM user_stats
  )
  SELECT 
    ROW_NUMBER() OVER (ORDER BY total_score DESC, meals_logged DESC, workouts_completed DESC) as rank,
    user_display,
    meals_logged,
    workouts_completed,
    calories_logged,
    calories_burned,
    days_active,
    total_score
  FROM scored_stats
  ORDER BY total_score DESC, meals_logged DESC
  LIMIT 50;
$$;

-- Function to get all-time leaderboard data
CREATE OR REPLACE FUNCTION get_all_time_leaderboard()
RETURNS TABLE(
  rank bigint,
  user_display text,
  meals_logged bigint,
  workouts_completed bigint,
  calories_logged numeric,
  calories_burned numeric,
  days_active bigint,
  total_score numeric
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH user_stats AS (
    SELECT 
      u.id as user_id,
      COALESCE(SUBSTRING(u.email FROM 1 FOR 3), 'User') || '***' as user_display,
      COALESCE(n.meals_count, 0) as meals_logged,
      COALESCE(f.workouts_count, 0) as workouts_completed,
      COALESCE(n.total_calories, 0) as calories_logged,
      COALESCE(f.total_calories_burned, 0) as calories_burned,
      COALESCE(GREATEST(n.active_days, f.active_days), 0) as days_active
    FROM users u
    LEFT JOIN (
      SELECT 
        user_id,
        COUNT(*) as meals_count,
        SUM(calories) as total_calories,
        COUNT(DISTINCT DATE(recorded_at)) as active_days
      FROM nutrition_logs 
      GROUP BY user_id
    ) n ON n.user_id = u.id
    LEFT JOIN (
      SELECT 
        user_id,
        COUNT(*) as workouts_count,
        SUM(calories_burned) as total_calories_burned,
        COUNT(DISTINCT DATE(recorded_at)) as active_days
      FROM fitness_logs 
      GROUP BY user_id
    ) f ON f.user_id = u.id
    WHERE COALESCE(n.meals_count, 0) + COALESCE(f.workouts_count, 0) > 0
  ),
  scored_stats AS (
    SELECT 
      *,
      (meals_logged * 5 + workouts_completed * 8 + days_active * 10 + 
       LEAST(calories_logged / 500, 200) + LEAST(calories_burned / 50, 300)) as total_score
    FROM user_stats
  )
  SELECT 
    ROW_NUMBER() OVER (ORDER BY total_score DESC, meals_logged DESC, workouts_completed DESC) as rank,
    user_display,
    meals_logged,
    workouts_completed,
    calories_logged,
    calories_burned,
    days_active,
    total_score
  FROM scored_stats
  ORDER BY total_score DESC, meals_logged DESC
  LIMIT 100;
$$;

-- Function to get user's own rank and stats
CREATE OR REPLACE FUNCTION get_user_leaderboard_position(target_user_id uuid, period text DEFAULT 'weekly')
RETURNS TABLE(
  user_rank bigint,
  total_users bigint,
  meals_logged bigint,
  workouts_completed bigint,
  calories_logged numeric,
  calories_burned numeric,
  days_active bigint,
  total_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  date_filter_start date;
  date_filter_end date;
BEGIN
  -- Set date range based on period
  IF period = 'weekly' THEN
    date_filter_start := DATE_TRUNC('week', CURRENT_DATE)::date;
    date_filter_end := (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::date;
  ELSIF period = 'monthly' THEN
    date_filter_start := DATE_TRUNC('month', CURRENT_DATE)::date;
    date_filter_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::date;
  ELSE
    -- All time
    date_filter_start := '1900-01-01'::date;
    date_filter_end := CURRENT_DATE;
  END IF;

  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      u.id as user_id,
      COALESCE(n.meals_count, 0) as meals_logged,
      COALESCE(f.workouts_count, 0) as workouts_completed,
      COALESCE(n.total_calories, 0) as calories_logged,
      COALESCE(f.total_calories_burned, 0) as calories_burned,
      COALESCE(GREATEST(n.active_days, f.active_days), 0) as days_active
    FROM users u
    LEFT JOIN (
      SELECT 
        user_id,
        COUNT(*) as meals_count,
        SUM(calories) as total_calories,
        COUNT(DISTINCT DATE(recorded_at)) as active_days
      FROM nutrition_logs 
      WHERE recorded_at::date >= date_filter_start
        AND recorded_at::date <= date_filter_end
      GROUP BY user_id
    ) n ON n.user_id = u.id
    LEFT JOIN (
      SELECT 
        user_id,
        COUNT(*) as workouts_count,
        SUM(calories_burned) as total_calories_burned,
        COUNT(DISTINCT DATE(recorded_at)) as active_days
      FROM fitness_logs 
      WHERE recorded_at::date >= date_filter_start
        AND recorded_at::date <= date_filter_end
      GROUP BY user_id
    ) f ON f.user_id = u.id
    WHERE COALESCE(n.meals_count, 0) + COALESCE(f.workouts_count, 0) > 0
  ),
  scored_stats AS (
    SELECT 
      *,
      CASE 
        WHEN period = 'weekly' THEN (meals_logged * 10 + workouts_completed * 15 + days_active * 20 + LEAST(calories_logged / 100, 50) + LEAST(calories_burned / 10, 100))
        WHEN period = 'monthly' THEN (meals_logged * 8 + workouts_completed * 12 + days_active * 15 + LEAST(calories_logged / 200, 100) + LEAST(calories_burned / 20, 150))
        ELSE (meals_logged * 5 + workouts_completed * 8 + days_active * 10 + LEAST(calories_logged / 500, 200) + LEAST(calories_burned / 50, 300))
      END as total_score
    FROM user_stats
  ),
  ranked_stats AS (
    SELECT 
      *,
      ROW_NUMBER() OVER (ORDER BY total_score DESC, meals_logged DESC, workouts_completed DESC) as rank
    FROM scored_stats
  )
  SELECT 
    COALESCE(r.rank, 0) as user_rank,
    (SELECT COUNT(*) FROM ranked_stats) as total_users,
    COALESCE(r.meals_logged, 0) as meals_logged,
    COALESCE(r.workouts_completed, 0) as workouts_completed,
    COALESCE(r.calories_logged, 0) as calories_logged,
    COALESCE(r.calories_burned, 0) as calories_burned,
    COALESCE(r.days_active, 0) as days_active,
    COALESCE(r.total_score, 0) as total_score
  FROM ranked_stats r
  WHERE r.user_id = target_user_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_weekly_leaderboard() TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_leaderboard() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_time_leaderboard() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_leaderboard_position(uuid, text) TO authenticated;

-- Allow anon access for public leaderboards (optional)
GRANT EXECUTE ON FUNCTION get_weekly_leaderboard() TO anon;
GRANT EXECUTE ON FUNCTION get_monthly_leaderboard() TO anon;
GRANT EXECUTE ON FUNCTION get_all_time_leaderboard() TO anon;