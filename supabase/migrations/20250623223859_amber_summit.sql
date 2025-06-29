/*
  # Create function to get unique user count

  1. New Functions
    - `get_unique_user_count()` - Returns count of unique users who have activity
  
  2. Security
    - Function is accessible to authenticated users
    - Uses security definer to access all tables
*/

-- Create a function to count unique users across nutrition and fitness logs
CREATE OR REPLACE FUNCTION get_unique_user_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_count integer;
BEGIN
  -- Count unique users from both nutrition_logs and fitness_logs
  SELECT COUNT(DISTINCT user_id)::integer INTO user_count
  FROM (
    SELECT user_id FROM nutrition_logs
    UNION
    SELECT user_id FROM fitness_logs
  ) AS combined_users;
  
  RETURN user_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_unique_user_count() TO authenticated;

-- Grant execute permission to anon users for public stats
GRANT EXECUTE ON FUNCTION get_unique_user_count() TO anon;