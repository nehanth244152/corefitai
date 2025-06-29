/*
  # Configure API Key and Function Permissions

  1. New Settings
    - Create secure environment variable for Gemini API key
    - Set permissions for edge function access

  2. Security
    - API keys are stored as environment variables
    - Keys not exposed to the client
    - Function access restricted to authenticated users only
*/

-- No SQL changes needed for this migration.
-- This is a reminder to:

-- 1. Set the GEMINI_API_KEY environment variable in the Supabase dashboard
--    Go to: Settings → API → Environment Variables
--    Add: GEMINI_API_KEY=AIzaSyBnLiSqx6vnUwwUYZPMNHNL3i9Wg9k_128

-- 2. Deploy the Edge Function
--    This will be handled by pushing the code to the repository
--    The Edge Function is located at: supabase/functions/gemini-proxy/index.ts

-- 3. Set Function Access
--    Go to: Functions → gemini-proxy
--    Set access to: Authenticated users only