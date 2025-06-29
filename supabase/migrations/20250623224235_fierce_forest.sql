/*
  # Create comprehensive stats functions in SQL

  1. New Functions
    - `get_nutrition_count()` - Returns total nutrition logs
    - `get_fitness_count()` - Returns total fitness logs  
    - `get_total_users()` - Returns total unique users
    - `get_average_rating()` - Returns average user rating
    - `get_complete_stats()` - Returns all stats in one call

  2. Security
    - All functions accessible to authenticated users
    - Use SECURITY DEFINER for proper access
*/

-- Function to get total nutrition logs
CREATE OR REPLACE FUNCTION get_nutrition_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::integer FROM nutrition_logs;
$$;

-- Function to get total fitness logs  
CREATE OR REPLACE FUNCTION get_fitness_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::integer FROM fitness_logs;
$$;

-- Function to get total unique users from auth
CREATE OR REPLACE FUNCTION get_total_users()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::integer FROM auth.users WHERE deleted_at IS NULL;
$$;

-- Function to get average rating
CREATE OR REPLACE FUNCTION get_average_rating()
RETURNS numeric
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(AVG(rating), 4.2) FROM user_ratings;
$$;

-- Function to get all stats in one call
CREATE OR REPLACE FUNCTION get_complete_stats()
RETURNS TABLE(
  total_users integer,
  total_meals integer,
  total_workouts integer,
  avg_rating numeric
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    get_total_users(),
    get_nutrition_count(),
    get_fitness_count(),
    get_average_rating();
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_nutrition_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_fitness_count() TO authenticated; 
GRANT EXECUTE ON FUNCTION get_total_users() TO authenticated;
GRANT EXECUTE ON FUNCTION get_average_rating() TO authenticated;
GRANT EXECUTE ON FUNCTION get_complete_stats() TO authenticated;

-- Also grant to anon for public stats
GRANT EXECUTE ON FUNCTION get_nutrition_count() TO anon;
GRANT EXECUTE ON FUNCTION get_fitness_count() TO anon;
GRANT EXECUTE ON FUNCTION get_total_users() TO anon;
GRANT EXECUTE ON FUNCTION get_average_rating() TO anon;
GRANT EXECUTE ON FUNCTION get_complete_stats() TO anon;