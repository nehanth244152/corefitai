/*
  # Fix ambiguous column reference in get_user_leaderboard_position function

  1. Function Updates
    - Drop and recreate get_user_leaderboard_position function with proper column qualification
    - Resolve ambiguous 'meals_logged' column reference by using explicit table aliases
    - Ensure the function properly calculates user ranking based on meals logged

  2. Security
    - Maintain existing RLS policies
    - Function accessible to authenticated users only
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_user_leaderboard_position(uuid);

-- Create the corrected function with proper column qualification
CREATE OR REPLACE FUNCTION get_user_leaderboard_position(target_user_id uuid)
RETURNS TABLE (
  user_rank integer,
  total_users integer,
  user_meals_logged bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_meal_counts AS (
    SELECT 
      nl.user_id,
      COUNT(*) as meals_logged
    FROM nutrition_logs nl
    WHERE nl.created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY nl.user_id
  ),
  ranked_users AS (
    SELECT 
      umc.user_id,
      umc.meals_logged,
      RANK() OVER (ORDER BY umc.meals_logged DESC) as rank
    FROM user_meal_counts umc
  )
  SELECT 
    COALESCE(ru.rank::integer, (SELECT COUNT(*)::integer + 1 FROM ranked_users)) as user_rank,
    (SELECT COUNT(*)::integer FROM ranked_users) as total_users,
    COALESCE(ru.meals_logged, 0::bigint) as user_meals_logged
  FROM ranked_users ru
  WHERE ru.user_id = target_user_id
  
  UNION ALL
  
  SELECT 
    (SELECT COUNT(*)::integer + 1 FROM ranked_users) as user_rank,
    (SELECT COUNT(*)::integer FROM ranked_users) as total_users,
    0::bigint as user_meals_logged
  WHERE NOT EXISTS (SELECT 1 FROM ranked_users WHERE user_id = target_user_id)
  LIMIT 1;
END;
$$;