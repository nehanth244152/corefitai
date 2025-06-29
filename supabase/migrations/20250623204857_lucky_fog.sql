/*
  # Create function to count authenticated users

  1. New Functions
    - `get_user_count()` - Returns the count of authenticated users
  
  2. Security
    - Function is accessible to authenticated users
    - Uses security definer to access auth schema
*/

-- Create a function to count users from auth.users
CREATE OR REPLACE FUNCTION get_user_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_count integer;
BEGIN
  -- Count users from auth.users table
  SELECT COUNT(*)::integer INTO user_count
  FROM auth.users
  WHERE deleted_at IS NULL;
  
  RETURN user_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_count() TO authenticated;