-- Enhanced leaderboard functions with better username generation
-- Drop existing functions first
DROP FUNCTION IF EXISTS get_weekly_leaderboard();
DROP FUNCTION IF EXISTS get_monthly_leaderboard();
DROP FUNCTION IF EXISTS get_all_time_leaderboard();
DROP FUNCTION IF EXISTS get_user_leaderboard_position(uuid, text);

-- Create a function to generate better usernames
CREATE OR REPLACE FUNCTION generate_display_name(user_email text, user_uuid uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  display_name text;
  email_username text;
  clean_name text;
  words text[];
  uuid_short text;
  name_options text[] := ARRAY['Alex', 'Jordan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Sage', 'River', 'Blake', 'Drew'];
  suffix_options text[] := ARRAY['Fit', 'Strong', 'Active', 'Healthy', 'Power', 'Energy', 'Sport', 'Vital', 'Pro', 'Elite'];
  name_index integer;
  suffix_index integer;
  number_suffix integer;
BEGIN
  -- Try to create display name from email first
  IF user_email IS NOT NULL AND user_email != '' THEN
    email_username := split_part(user_email, '@', 1);
    
    IF email_username IS NOT NULL AND email_username != '' THEN
      -- Clean the email username
      clean_name := regexp_replace(email_username, '[._-]', '', 'g');
      clean_name := regexp_replace(clean_name, '\d+$', '');
      
      IF length(clean_name) >= 3 THEN
        -- Use first part of email with some obfuscation
        display_name := initcap(substring(clean_name from 1 for 4)) || 
                       substring(user_uuid::text from 1 for 2) ||
                       (extract(epoch from now())::bigint % 99 + 1)::text;
        RETURN display_name;
      END IF;
    END IF;
  END IF;
  
  -- Fallback: Generate name from UUID
  uuid_short := regexp_replace(user_uuid::text, '-', '', 'g');
  name_index := (('x' || substring(uuid_short from 1 for 2))::bit(8)::int % array_length(name_options, 1)) + 1;
  suffix_index := (('x' || substring(uuid_short from 3 for 2))::bit(8)::int % array_length(suffix_options, 1)) + 1;
  number_suffix := (('x' || substring(uuid_short from 5 for 2))::bit(8)::int % 99) + 1;
  
  display_name := name_options[name_index] || suffix_options[suffix_index] || number_suffix::text;
  
  RETURN display_name;
END;
$$;

-- Function to get weekly leaderboard with proper usernames
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
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH weekly_stats AS (
    SELECT 
      u.id as user_id,
      generate_display_name(u.email, u.id) as user_display,
      COALESCE(nutrition_stats.meals_count, 0) as meals_logged,
      COALESCE(fitness_stats.workouts_count, 0) as workouts_completed,
      COALESCE(nutrition_stats.total_calories, 0) as calories_logged,
      COALESCE(fitness_stats.total_burned, 0) as calories_burned,
      COALESCE(GREATEST(
        COALESCE(nutrition_stats.active_days, 0),
        COALESCE(fitness_stats.active_days, 0)
      ), 0) as days_active
    FROM users u
    LEFT JOIN (
      SELECT 
        nl.user_id,
        COUNT(*) as meals_count,
        SUM(nl.calories) as total_calories,
        COUNT(DISTINCT DATE(nl.recorded_at)) as active_days
      FROM nutrition_logs nl
      WHERE nl.recorded_at >= date_trunc('week', NOW())
      GROUP BY nl.user_id
    ) nutrition_stats ON u.id = nutrition_stats.user_id
    LEFT JOIN (
      SELECT 
        fl.user_id,
        COUNT(*) as workouts_count,
        SUM(fl.calories_burned) as total_burned,
        COUNT(DISTINCT DATE(fl.recorded_at)) as active_days
      FROM fitness_logs fl
      WHERE fl.recorded_at >= date_trunc('week', NOW())
      GROUP BY fl.user_id
    ) fitness_stats ON u.id = fitness_stats.user_id
    WHERE COALESCE(nutrition_stats.meals_count, 0) > 0 
       OR COALESCE(fitness_stats.workouts_count, 0) > 0
  ),
  scored_stats AS (
    SELECT 
      ws.*,
      (ws.meals_logged * 10 + ws.workouts_completed * 20 + ws.days_active * 15 + 
       ws.calories_logged * 0.01 + ws.calories_burned * 0.02) as total_score
    FROM weekly_stats ws
  )
  SELECT 
    ROW_NUMBER() OVER (ORDER BY ss.total_score DESC, ss.meals_logged DESC, ss.workouts_completed DESC) as rank,
    ss.user_display,
    ss.meals_logged,
    ss.workouts_completed,
    ss.calories_logged,
    ss.calories_burned,
    ss.days_active,
    ss.total_score
  FROM scored_stats ss
  ORDER BY ss.total_score DESC, ss.meals_logged DESC, ss.workouts_completed DESC
  LIMIT 100;
END;
$$;

-- Function to get monthly leaderboard with proper usernames
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
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH monthly_stats AS (
    SELECT 
      u.id as user_id,
      generate_display_name(u.email, u.id) as user_display,
      COALESCE(nutrition_stats.meals_count, 0) as meals_logged,
      COALESCE(fitness_stats.workouts_count, 0) as workouts_completed,
      COALESCE(nutrition_stats.total_calories, 0) as calories_logged,
      COALESCE(fitness_stats.total_burned, 0) as calories_burned,
      COALESCE(GREATEST(
        COALESCE(nutrition_stats.active_days, 0),
        COALESCE(fitness_stats.active_days, 0)
      ), 0) as days_active
    FROM users u
    LEFT JOIN (
      SELECT 
        nl.user_id,
        COUNT(*) as meals_count,
        SUM(nl.calories) as total_calories,
        COUNT(DISTINCT DATE(nl.recorded_at)) as active_days
      FROM nutrition_logs nl
      WHERE nl.recorded_at >= date_trunc('month', NOW())
      GROUP BY nl.user_id
    ) nutrition_stats ON u.id = nutrition_stats.user_id
    LEFT JOIN (
      SELECT 
        fl.user_id,
        COUNT(*) as workouts_count,
        SUM(fl.calories_burned) as total_burned,
        COUNT(DISTINCT DATE(fl.recorded_at)) as active_days
      FROM fitness_logs fl
      WHERE fl.recorded_at >= date_trunc('month', NOW())
      GROUP BY fl.user_id
    ) fitness_stats ON u.id = fitness_stats.user_id
    WHERE COALESCE(nutrition_stats.meals_count, 0) > 0 
       OR COALESCE(fitness_stats.workouts_count, 0) > 0
  ),
  scored_stats AS (
    SELECT 
      ms.*,
      (ms.meals_logged * 10 + ms.workouts_completed * 20 + ms.days_active * 15 + 
       ms.calories_logged * 0.01 + ms.calories_burned * 0.02) as total_score
    FROM monthly_stats ms
  )
  SELECT 
    ROW_NUMBER() OVER (ORDER BY ss.total_score DESC, ss.meals_logged DESC, ss.workouts_completed DESC) as rank,
    ss.user_display,
    ss.meals_logged,
    ss.workouts_completed,
    ss.calories_logged,
    ss.calories_burned,
    ss.days_active,
    ss.total_score
  FROM scored_stats ss
  ORDER BY ss.total_score DESC, ss.meals_logged DESC, ss.workouts_completed DESC
  LIMIT 100;
END;
$$;

-- Function to get all-time leaderboard with proper usernames
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
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH all_time_stats AS (
    SELECT 
      u.id as user_id,
      generate_display_name(u.email, u.id) as user_display,
      COALESCE(nutrition_stats.meals_count, 0) as meals_logged,
      COALESCE(fitness_stats.workouts_count, 0) as workouts_completed,
      COALESCE(nutrition_stats.total_calories, 0) as calories_logged,
      COALESCE(fitness_stats.total_burned, 0) as calories_burned,
      COALESCE(GREATEST(
        COALESCE(nutrition_stats.active_days, 0),
        COALESCE(fitness_stats.active_days, 0)
      ), 0) as days_active
    FROM users u
    LEFT JOIN (
      SELECT 
        nl.user_id,
        COUNT(*) as meals_count,
        SUM(nl.calories) as total_calories,
        COUNT(DISTINCT DATE(nl.recorded_at)) as active_days
      FROM nutrition_logs nl
      GROUP BY nl.user_id
    ) nutrition_stats ON u.id = nutrition_stats.user_id
    LEFT JOIN (
      SELECT 
        fl.user_id,
        COUNT(*) as workouts_count,
        SUM(fl.calories_burned) as total_burned,
        COUNT(DISTINCT DATE(fl.recorded_at)) as active_days
      FROM fitness_logs fl
      GROUP BY fl.user_id
    ) fitness_stats ON u.id = fitness_stats.user_id
    WHERE COALESCE(nutrition_stats.meals_count, 0) > 0 
       OR COALESCE(fitness_stats.workouts_count, 0) > 0
  ),
  scored_stats AS (
    SELECT 
      ats.*,
      (ats.meals_logged * 10 + ats.workouts_completed * 20 + ats.days_active * 15 + 
       ats.calories_logged * 0.01 + ats.calories_burned * 0.02) as total_score
    FROM all_time_stats ats
  )
  SELECT 
    ROW_NUMBER() OVER (ORDER BY ss.total_score DESC, ss.meals_logged DESC, ss.workouts_completed DESC) as rank,
    ss.user_display,
    ss.meals_logged,
    ss.workouts_completed,
    ss.calories_logged,
    ss.calories_burned,
    ss.days_active,
    ss.total_score
  FROM scored_stats ss
  ORDER BY ss.total_score DESC, ss.meals_logged DESC, ss.workouts_completed DESC
  LIMIT 100;
END;
$$;

-- Function to get user leaderboard position with proper username
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
SECURITY DEFINER
AS $$
DECLARE
  date_filter timestamp with time zone;
BEGIN
  -- Set date filter based on period
  CASE period
    WHEN 'weekly' THEN
      date_filter := date_trunc('week', NOW());
    WHEN 'monthly' THEN
      date_filter := date_trunc('month', NOW());
    ELSE
      date_filter := '1900-01-01'::timestamp with time zone; -- All time
  END CASE;

  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      u.id as user_id,
      COALESCE(nutrition_data.meals_count, 0) as user_meals_logged,
      COALESCE(fitness_data.workouts_count, 0) as user_workouts_completed,
      COALESCE(nutrition_data.total_calories, 0) as user_calories_logged,
      COALESCE(fitness_data.total_burned, 0) as user_calories_burned,
      COALESCE(GREATEST(
        COALESCE(nutrition_data.active_days, 0),
        COALESCE(fitness_data.active_days, 0)
      ), 0) as user_days_active
    FROM users u
    LEFT JOIN (
      SELECT 
        nl.user_id,
        COUNT(*) as meals_count,
        SUM(nl.calories) as total_calories,
        COUNT(DISTINCT DATE(nl.recorded_at)) as active_days
      FROM nutrition_logs nl
      WHERE nl.recorded_at >= date_filter
      GROUP BY nl.user_id
    ) nutrition_data ON u.id = nutrition_data.user_id
    LEFT JOIN (
      SELECT 
        fl.user_id,
        COUNT(*) as workouts_count,
        SUM(fl.calories_burned) as total_burned,
        COUNT(DISTINCT DATE(fl.recorded_at)) as active_days
      FROM fitness_logs fl
      WHERE fl.recorded_at >= date_filter
      GROUP BY fl.user_id
    ) fitness_data ON u.id = fitness_data.user_id
    WHERE u.id = target_user_id
  ),
  all_users_stats AS (
    SELECT 
      u.id as user_id,
      COALESCE(nutrition_data.meals_count, 0) as all_meals_logged,
      COALESCE(fitness_data.workouts_count, 0) as all_workouts_completed,
      COALESCE(nutrition_data.total_calories, 0) as all_calories_logged,
      COALESCE(fitness_data.total_burned, 0) as all_calories_burned,
      COALESCE(GREATEST(
        COALESCE(nutrition_data.active_days, 0),
        COALESCE(fitness_data.active_days, 0)
      ), 0) as all_days_active
    FROM users u
    LEFT JOIN (
      SELECT 
        nl.user_id,
        COUNT(*) as meals_count,
        SUM(nl.calories) as total_calories,
        COUNT(DISTINCT DATE(nl.recorded_at)) as active_days
      FROM nutrition_logs nl
      WHERE nl.recorded_at >= date_filter
      GROUP BY nl.user_id
    ) nutrition_data ON u.id = nutrition_data.user_id
    LEFT JOIN (
      SELECT 
        fl.user_id,
        COUNT(*) as workouts_count,
        SUM(fl.calories_burned) as total_burned,
        COUNT(DISTINCT DATE(fl.recorded_at)) as active_days
      FROM fitness_logs fl
      WHERE fl.recorded_at >= date_filter
      GROUP BY fl.user_id
    ) fitness_data ON u.id = fitness_data.user_id
    WHERE COALESCE(nutrition_data.meals_count, 0) > 0 
       OR COALESCE(fitness_data.workouts_count, 0) > 0
  ),
  scored_users AS (
    SELECT 
      aus.user_id,
      aus.all_meals_logged,
      aus.all_workouts_completed,
      aus.all_calories_logged,
      aus.all_calories_burned,
      aus.all_days_active,
      (aus.all_meals_logged * 10 + aus.all_workouts_completed * 20 + aus.all_days_active * 15 + 
       aus.all_calories_logged * 0.01 + aus.all_calories_burned * 0.02) as calculated_total_score
    FROM all_users_stats aus
  ),
  ranked_users AS (
    SELECT 
      su.*,
      ROW_NUMBER() OVER (ORDER BY su.calculated_total_score DESC, su.all_meals_logged DESC, su.all_workouts_completed DESC) as user_rank_position
    FROM scored_users su
  ),
  target_user_data AS (
    SELECT 
      us.user_meals_logged,
      us.user_workouts_completed,
      us.user_calories_logged,
      us.user_calories_burned,
      us.user_days_active,
      (us.user_meals_logged * 10 + us.user_workouts_completed * 20 + us.user_days_active * 15 + 
       us.user_calories_logged * 0.01 + us.user_calories_burned * 0.02) as target_total_score
    FROM user_stats us
  )
  SELECT 
    COALESCE(ru.user_rank_position, (SELECT COUNT(*) FROM ranked_users) + 1) as user_rank,
    (SELECT COUNT(*) FROM ranked_users) as total_users,
    tud.user_meals_logged as meals_logged,
    tud.user_workouts_completed as workouts_completed,
    tud.user_calories_logged as calories_logged,
    tud.user_calories_burned as calories_burned,
    tud.user_days_active as days_active,
    tud.target_total_score as total_score
  FROM target_user_data tud
  LEFT JOIN ranked_users ru ON ru.user_id = target_user_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION generate_display_name(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_weekly_leaderboard() TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_leaderboard() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_time_leaderboard() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_leaderboard_position(uuid, text) TO authenticated;