/*
  # Improve leaderboard with alphabetic-only usernames and top 10 limit

  1. Improvements
    - Remove all numeric characters from usernames
    - Limit all leaderboard results to top 10 users
    - Update username generation to use more variety in display names
    - Make sure usernames are properly capitalized
    
  2. Changes
    - Update generate_display_name function to filter out all numbers
    - Change LIMIT clauses in all leaderboard functions from 100 to 10
    - Increase variety in name options
    - Use initcap() for consistent capitalization
*/

-- Drop existing function
DROP FUNCTION IF EXISTS generate_display_name(text, uuid);

-- Create improved version that removes all numbers from usernames
CREATE OR REPLACE FUNCTION generate_display_name(user_email text, user_uuid uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  display_name text;
  email_username text;
  clean_username text;
  uuid_short text;
  
  -- Expanded name options for more variety
  name_options text[] := ARRAY[
    'Alex', 'Jordan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Sage', 'River', 
    'Blake', 'Drew', 'Rowan', 'Skyler', 'Phoenix', 'Dakota', 'Cameron', 'Finley',
    'Taylor', 'Morgan', 'Jamie', 'Kendall', 'Parker', 'Reese', 'Peyton', 'Bailey',
    'Emery', 'Hayden', 'Jesse', 'Kerry', 'Lesley', 'Maddox', 'Robin', 'Shawn',
    'Aiden', 'Briar', 'Cody', 'Devin', 'Ellis', 'Fallon', 'Greer', 'Harper'
  ];
  suffix_options text[] := ARRAY[
    'Fit', 'Strong', 'Active', 'Healthy', 'Power', 'Energy', 'Sport', 'Vital', 
    'Pro', 'Elite', 'Swift', 'Bold', 'Brave', 'Peak', 'Core', 'Prime',
    'Zen', 'Focus', 'Calm', 'Balance', 'Flex', 'Move', 'Action', 'Vigor',
    'Rise', 'Climb', 'Advance', 'Thrive', 'Achieve', 'Excel', 'Triumph', 'Victory'
  ];
  
  name_index integer;
  suffix_index integer;
BEGIN
  -- Get username from email
  IF user_email IS NOT NULL AND user_email != '' THEN
    -- Extract the part before @ symbol
    email_username := split_part(user_email, '@', 1);
    
    IF email_username IS NOT NULL AND email_username != '' THEN
      -- Keep only alphabetic characters (remove numbers and special chars)
      clean_username := regexp_replace(email_username, '[^a-zA-Z]', '', 'g');
      
      -- If the username still has sufficient content, use it
      IF length(clean_username) >= 3 THEN
        -- Properly capitalize the name
        display_name := initcap(clean_username);
        RETURN display_name;
      END IF;
    END IF;
  END IF;
  
  -- Fallback: Generate deterministic name from UUID
  uuid_short := replace(user_uuid::text, '-', '');
  
  -- Use parts of UUID to deterministically select name components
  name_index := (('x' || substring(uuid_short from 1 for 4))::bit(16)::int % array_length(name_options, 1)) + 1;
  suffix_index := (('x' || substring(uuid_short from 5 for 4))::bit(16)::int % array_length(suffix_options, 1)) + 1;
  
  -- Create display name without adding numbers
  display_name := name_options[name_index] || suffix_options[suffix_index];
  
  RETURN display_name;
END;
$$;

-- Update weekly leaderboard to limit to top 10 users
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
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
  RETURN QUERY
  WITH weekly_stats AS (
    SELECT 
      u.id as user_id,
      generate_display_name(u.email, u.id) as user_display,
      COALESCE(nutrition_stats.meals_count, 0) as meals_logged,
      COALESCE(fitness_stats.workouts_count, 0) as workouts_completed,
      COALESCE(nutrition_stats.total_calories, 0)::numeric as calories_logged,
      COALESCE(fitness_stats.total_burned, 0)::numeric as calories_burned,
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
        AND nl.recorded_at < date_trunc('week', NOW()) + INTERVAL '7 days'
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
        AND fl.recorded_at < date_trunc('week', NOW()) + INTERVAL '7 days'
      GROUP BY fl.user_id
    ) fitness_stats ON u.id = fitness_stats.user_id
    -- Include all users who have any activity this week
    WHERE COALESCE(nutrition_stats.meals_count, 0) > 0 
       OR COALESCE(fitness_stats.workouts_count, 0) > 0
  ),
  scored_stats AS (
    SELECT 
      ws.*,
      (ws.meals_logged * 10 + ws.workouts_completed * 20 + ws.days_active * 15 + 
       ws.calories_logged * 0.01 + ws.calories_burned * 0.02)::numeric as total_score
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
  LIMIT 10; -- Changed from 100 to 10
END;
$$;

-- Update monthly leaderboard to limit to top 10 users
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
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
  RETURN QUERY
  WITH monthly_stats AS (
    SELECT 
      u.id as user_id,
      generate_display_name(u.email, u.id) as user_display,
      COALESCE(nutrition_stats.meals_count, 0) as meals_logged,
      COALESCE(fitness_stats.workouts_count, 0) as workouts_completed,
      COALESCE(nutrition_stats.total_calories, 0)::numeric as calories_logged,
      COALESCE(fitness_stats.total_burned, 0)::numeric as calories_burned,
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
        AND nl.recorded_at < date_trunc('month', NOW()) + INTERVAL '1 month'
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
        AND fl.recorded_at < date_trunc('month', NOW()) + INTERVAL '1 month'
      GROUP BY fl.user_id
    ) fitness_stats ON u.id = fitness_stats.user_id
    -- Include all users who have any activity this month
    WHERE COALESCE(nutrition_stats.meals_count, 0) > 0 
       OR COALESCE(fitness_stats.workouts_count, 0) > 0
  ),
  scored_stats AS (
    SELECT 
      ms.*,
      (ms.meals_logged * 8 + ms.workouts_completed * 16 + ms.days_active * 12 + 
       ms.calories_logged * 0.008 + ms.calories_burned * 0.015)::numeric as total_score
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
  LIMIT 10; -- Changed from 100 to 10
END;
$$;

-- Update all-time leaderboard to limit to top 10 users
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
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
  RETURN QUERY
  WITH all_time_stats AS (
    SELECT 
      u.id as user_id,
      generate_display_name(u.email, u.id) as user_display,
      COALESCE(nutrition_stats.meals_count, 0) as meals_logged,
      COALESCE(fitness_stats.workouts_count, 0) as workouts_completed,
      COALESCE(nutrition_stats.total_calories, 0)::numeric as calories_logged,
      COALESCE(fitness_stats.total_burned, 0)::numeric as calories_burned,
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
    -- Include all users who have any activity ever
    WHERE COALESCE(nutrition_stats.meals_count, 0) > 0 
       OR COALESCE(fitness_stats.workouts_count, 0) > 0
  ),
  scored_stats AS (
    SELECT 
      ats.*,
      (ats.meals_logged * 5 + ats.workouts_completed * 10 + ats.days_active * 8 + 
       ats.calories_logged * 0.005 + ats.calories_burned * 0.01)::numeric as total_score
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
  LIMIT 10; -- Changed from 100 to 10
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION generate_display_name(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_weekly_leaderboard() TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_leaderboard() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_time_leaderboard() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_leaderboard_position(uuid, text) TO authenticated;

-- Also grant to anon for public leaderboards (optional)
GRANT EXECUTE ON FUNCTION generate_display_name(text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_weekly_leaderboard() TO anon;
GRANT EXECUTE ON FUNCTION get_monthly_leaderboard() TO anon;
GRANT EXECUTE ON FUNCTION get_all_time_leaderboard() TO anon;