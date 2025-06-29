/*
  # Fix leaderboard RPC function data type mismatch

  1. Function Updates
     - Fix `get_user_leaderboard_position` function to ensure returned types match declared types
     - Cast bigint columns to numeric to match function signature
  
  2. Changes Made
     - Cast calories_logged, calories_burned, and total_score to numeric in SELECT statements
     - Ensure all returned data types match the RETURNS TABLE declaration
*/

-- Drop and recreate the get_user_leaderboard_position function with proper type casting
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
)
LANGUAGE plpgsql
AS $$
BEGIN
  IF period = 'weekly' THEN
    RETURN QUERY
    WITH user_stats AS (
      SELECT 
        u.id as user_id,
        COALESCE(n.meals_logged, 0) as meals_logged,
        COALESCE(f.workouts_completed, 0) as workouts_completed,
        COALESCE(n.calories_logged, 0)::numeric as calories_logged,
        COALESCE(f.calories_burned, 0)::numeric as calories_burned,
        COALESCE(GREATEST(n.days_active, f.days_active), 0) as days_active
      FROM users u
      LEFT JOIN (
        SELECT 
          user_id,
          COUNT(DISTINCT DATE(recorded_at)) as meals_logged,
          SUM(calories)::numeric as calories_logged,
          COUNT(DISTINCT DATE(recorded_at)) as days_active
        FROM nutrition_logs 
        WHERE recorded_at >= date_trunc('week', now())
        GROUP BY user_id
      ) n ON u.id = n.user_id
      LEFT JOIN (
        SELECT 
          user_id,
          COUNT(*) as workouts_completed,
          SUM(calories_burned)::numeric as calories_burned,
          COUNT(DISTINCT DATE(recorded_at)) as days_active
        FROM fitness_logs 
        WHERE recorded_at >= date_trunc('week', now())
        GROUP BY user_id
      ) f ON u.id = f.user_id
    ),
    ranked_users AS (
      SELECT 
        user_id,
        meals_logged,
        workouts_completed,
        calories_logged,
        calories_burned,
        days_active,
        (meals_logged * 10 + workouts_completed * 15 + days_active * 5 + 
         calories_logged * 0.01 + calories_burned * 0.02)::numeric as total_score,
        ROW_NUMBER() OVER (ORDER BY 
          (meals_logged * 10 + workouts_completed * 15 + days_active * 5 + 
           calories_logged * 0.01 + calories_burned * 0.02) DESC
        ) as rank
      FROM user_stats
      WHERE meals_logged > 0 OR workouts_completed > 0
    )
    SELECT 
      r.rank,
      (SELECT COUNT(*) FROM ranked_users)::bigint as total_users,
      r.meals_logged,
      r.workouts_completed,
      r.calories_logged,
      r.calories_burned,
      r.days_active,
      r.total_score
    FROM ranked_users r
    WHERE r.user_id = target_user_id;
    
  ELSIF period = 'monthly' THEN
    RETURN QUERY
    WITH user_stats AS (
      SELECT 
        u.id as user_id,
        COALESCE(n.meals_logged, 0) as meals_logged,
        COALESCE(f.workouts_completed, 0) as workouts_completed,
        COALESCE(n.calories_logged, 0)::numeric as calories_logged,
        COALESCE(f.calories_burned, 0)::numeric as calories_burned,
        COALESCE(GREATEST(n.days_active, f.days_active), 0) as days_active
      FROM users u
      LEFT JOIN (
        SELECT 
          user_id,
          COUNT(DISTINCT DATE(recorded_at)) as meals_logged,
          SUM(calories)::numeric as calories_logged,
          COUNT(DISTINCT DATE(recorded_at)) as days_active
        FROM nutrition_logs 
        WHERE recorded_at >= date_trunc('month', now())
        GROUP BY user_id
      ) n ON u.id = n.user_id
      LEFT JOIN (
        SELECT 
          user_id,
          COUNT(*) as workouts_completed,
          SUM(calories_burned)::numeric as calories_burned,
          COUNT(DISTINCT DATE(recorded_at)) as days_active
        FROM fitness_logs 
        WHERE recorded_at >= date_trunc('month', now())
        GROUP BY user_id
      ) f ON u.id = f.user_id
    ),
    ranked_users AS (
      SELECT 
        user_id,
        meals_logged,
        workouts_completed,
        calories_logged,
        calories_burned,
        days_active,
        (meals_logged * 10 + workouts_completed * 15 + days_active * 5 + 
         calories_logged * 0.01 + calories_burned * 0.02)::numeric as total_score,
        ROW_NUMBER() OVER (ORDER BY 
          (meals_logged * 10 + workouts_completed * 15 + days_active * 5 + 
           calories_logged * 0.01 + calories_burned * 0.02) DESC
        ) as rank
      FROM user_stats
      WHERE meals_logged > 0 OR workouts_completed > 0
    )
    SELECT 
      r.rank,
      (SELECT COUNT(*) FROM ranked_users)::bigint as total_users,
      r.meals_logged,
      r.workouts_completed,
      r.calories_logged,
      r.calories_burned,
      r.days_active,
      r.total_score
    FROM ranked_users r
    WHERE r.user_id = target_user_id;
    
  ELSE -- all_time
    RETURN QUERY
    WITH user_stats AS (
      SELECT 
        u.id as user_id,
        COALESCE(n.meals_logged, 0) as meals_logged,
        COALESCE(f.workouts_completed, 0) as workouts_completed,
        COALESCE(n.calories_logged, 0)::numeric as calories_logged,
        COALESCE(f.calories_burned, 0)::numeric as calories_burned,
        COALESCE(GREATEST(n.days_active, f.days_active), 0) as days_active
      FROM users u
      LEFT JOIN (
        SELECT 
          user_id,
          COUNT(DISTINCT DATE(recorded_at)) as meals_logged,
          SUM(calories)::numeric as calories_logged,
          COUNT(DISTINCT DATE(recorded_at)) as days_active
        FROM nutrition_logs 
        GROUP BY user_id
      ) n ON u.id = n.user_id
      LEFT JOIN (
        SELECT 
          user_id,
          COUNT(*) as workouts_completed,
          SUM(calories_burned)::numeric as calories_burned,
          COUNT(DISTINCT DATE(recorded_at)) as days_active
        FROM fitness_logs 
        GROUP BY user_id
      ) f ON u.id = f.user_id
    ),
    ranked_users AS (
      SELECT 
        user_id,
        meals_logged,
        workouts_completed,
        calories_logged,
        calories_burned,
        days_active,
        (meals_logged * 10 + workouts_completed * 15 + days_active * 5 + 
         calories_logged * 0.01 + calories_burned * 0.02)::numeric as total_score,
        ROW_NUMBER() OVER (ORDER BY 
          (meals_logged * 10 + workouts_completed * 15 + days_active * 5 + 
           calories_logged * 0.01 + calories_burned * 0.02) DESC
        ) as rank
      FROM user_stats
      WHERE meals_logged > 0 OR workouts_completed > 0
    )
    SELECT 
      r.rank,
      (SELECT COUNT(*) FROM ranked_users)::bigint as total_users,
      r.meals_logged,
      r.workouts_completed,
      r.calories_logged,
      r.calories_burned,
      r.days_active,
      r.total_score
    FROM ranked_users r
    WHERE r.user_id = target_user_id;
  END IF;
END;
$$;