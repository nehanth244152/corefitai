/*
  # Fix leaderboard function type mismatch and reserved keyword issue

  1. Issues Fixed
    - Fix type mismatch between bigint and numeric in return columns
    - Replace reserved keyword "position" with "user_rank"
    - Ensure proper type casting for all aggregated values

  2. Function Updates
    - get_user_leaderboard_position: Fixed return types and column names
    - get_leaderboard: Fixed return types and column names
*/

-- Drop and recreate the get_user_leaderboard_position function with proper type casting
CREATE OR REPLACE FUNCTION get_user_leaderboard_position(user_uuid uuid)
RETURNS TABLE (
  user_id uuid,
  email text,
  total_workouts bigint,
  total_meals bigint,
  calories_logged numeric,
  user_rank bigint
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      u.id,
      u.email,
      COALESCE(fitness_count.total_workouts, 0) as total_workouts,
      COALESCE(nutrition_count.total_meals, 0) as total_meals,
      COALESCE(nutrition_calories.calories_logged, 0)::numeric as calories_logged
    FROM users u
    LEFT JOIN (
      SELECT 
        user_id, 
        COUNT(*)::bigint as total_workouts
      FROM fitness_logs 
      GROUP BY user_id
    ) fitness_count ON u.id = fitness_count.user_id
    LEFT JOIN (
      SELECT 
        user_id, 
        COUNT(*)::bigint as total_meals
      FROM nutrition_logs 
      GROUP BY user_id
    ) nutrition_count ON u.id = nutrition_count.user_id
    LEFT JOIN (
      SELECT 
        user_id, 
        SUM(calories)::numeric as calories_logged
      FROM nutrition_logs 
      GROUP BY user_id
    ) nutrition_calories ON u.id = nutrition_calories.user_id
  ),
  ranked_users AS (
    SELECT 
      *,
      ROW_NUMBER() OVER (
        ORDER BY 
          total_workouts DESC, 
          total_meals DESC, 
          calories_logged DESC
      )::bigint as user_rank
    FROM user_stats
  )
  SELECT 
    ranked_users.id,
    ranked_users.email,
    ranked_users.total_workouts,
    ranked_users.total_meals,
    ranked_users.calories_logged,
    ranked_users.user_rank
  FROM ranked_users
  WHERE ranked_users.id = user_uuid;
END;
$$;

-- Also fix the main leaderboard function if it exists and has similar issues
CREATE OR REPLACE FUNCTION get_leaderboard(limit_count integer DEFAULT 10)
RETURNS TABLE (
  user_id uuid,
  email text,
  total_workouts bigint,
  total_meals bigint,
  calories_logged numeric,
  user_rank bigint
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      u.id,
      u.email,
      COALESCE(fitness_count.total_workouts, 0) as total_workouts,
      COALESCE(nutrition_count.total_meals, 0) as total_meals,
      COALESCE(nutrition_calories.calories_logged, 0)::numeric as calories_logged
    FROM users u
    LEFT JOIN (
      SELECT 
        user_id, 
        COUNT(*)::bigint as total_workouts
      FROM fitness_logs 
      GROUP BY user_id
    ) fitness_count ON u.id = fitness_count.user_id
    LEFT JOIN (
      SELECT 
        user_id, 
        COUNT(*)::bigint as total_meals
      FROM nutrition_logs 
      GROUP BY user_id
    ) nutrition_count ON u.id = nutrition_count.user_id
    LEFT JOIN (
      SELECT 
        user_id, 
        SUM(calories)::numeric as calories_logged
      FROM nutrition_logs 
      GROUP BY user_id
    ) nutrition_calories ON u.id = nutrition_calories.user_id
  ),
  ranked_users AS (
    SELECT 
      *,
      ROW_NUMBER() OVER (
        ORDER BY 
          total_workouts DESC, 
          total_meals DESC, 
          calories_logged DESC
      )::bigint as user_rank
    FROM user_stats
  )
  SELECT 
    ranked_users.id,
    ranked_users.email,
    ranked_users.total_workouts,
    ranked_users.total_meals,
    ranked_users.calories_logged,
    ranked_users.user_rank
  FROM ranked_users
  ORDER BY ranked_users.user_rank
  LIMIT limit_count;
END;
$$;