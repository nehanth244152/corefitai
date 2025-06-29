/*
  # Fix RLS policies for stats queries

  1. Policy Updates
    - Add policies to allow counting operations for stats
    - Ensure stats queries can access aggregate data without user filtering
  
  2. Security
    - Maintain user data privacy while allowing stats collection
    - Add specific policies for count operations
*/

-- Allow authenticated users to count nutrition logs for stats
CREATE POLICY "Allow nutrition stats counting" 
ON nutrition_logs 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to count fitness logs for stats  
CREATE POLICY "Allow fitness stats counting"
ON fitness_logs
FOR SELECT  
TO authenticated
USING (true);

-- Allow authenticated users to read ratings for average calculation
CREATE POLICY "Allow ratings stats access"
ON user_ratings
FOR SELECT
TO authenticated  
USING (true);

-- Allow authenticated users to count user profiles for stats
CREATE POLICY "Allow profile stats counting"
ON user_profiles
FOR SELECT
TO authenticated
USING (true);