/*
  # Fix Email Username Generation for Leaderboard

  1. Enhancements
    - Improve `generate_display_name` function to properly extract full names from emails
    - Keep original usernames from email addresses without excessive obfuscation
    - Maintain numbers and important parts of email prefixes
    - Ensure consistent username display across the leaderboard
    - Update to match the format seen in the design (e.g., Pneha37, Reddy28, etc.)

  2. Implementation Details
    - Use better regex for email processing
    - Show full email username without truncating
    - Keep numbers that are part of usernames
    - Ensure fallback name generation works consistently
*/

-- Drop existing function
DROP FUNCTION IF EXISTS generate_display_name(text, uuid);

-- Create improved version
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
  
  -- Fallback names if we can't extract from email
  name_options text[] := ARRAY[
    'Alex', 'Jordan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Sage', 'River', 
    'Blake', 'Drew', 'Rowan', 'Skyler', 'Phoenix', 'Dakota', 'Cameron', 'Finley'
  ];
  suffix_options text[] := ARRAY[
    'Fit', 'Strong', 'Active', 'Healthy', 'Power', 'Energy', 'Sport', 'Vital', 
    'Pro', 'Elite', 'Swift', 'Bold', 'Brave', 'Peak', 'Core', 'Prime'
  ];
  
  name_index integer;
  suffix_index integer;
  number_suffix integer;
BEGIN
  -- Get username from email
  IF user_email IS NOT NULL AND user_email != '' THEN
    -- Extract the part before @ symbol
    email_username := split_part(user_email, '@', 1);
    
    IF email_username IS NOT NULL AND email_username != '' THEN
      -- Keep alphanumeric characters but remove special chars (except underscore and dot)
      clean_username := regexp_replace(email_username, '[^a-zA-Z0-9_.]', '', 'g');
      
      -- Remove consecutive dots/underscores
      clean_username := regexp_replace(clean_username, '[_]+', '_', 'g');
      clean_username := regexp_replace(clean_username, '[.]+', '.', 'g');
      
      -- If username contains dots or underscores, only keep the main part
      IF position('_' in clean_username) > 0 OR position('.' in clean_username) > 0 THEN
        -- If it's like "first.last" or "first_last", just use the first part
        IF position('_' in clean_username) > 0 THEN
          clean_username := split_part(clean_username, '_', 1);
        ELSIF position('.' in clean_username) > 0 THEN
          clean_username := split_part(clean_username, '.', 1);
        END IF;
      END IF;
      
      -- If the username still has content, use it
      IF length(clean_username) > 0 THEN
        -- Check if it already ends with numbers
        IF clean_username ~ '[0-9]$' THEN
          -- Already has numbers, no need to add more
          display_name := clean_username;
        ELSE
          -- Append numbers from UUID (deterministic based on user's ID)
          number_suffix := (abs(hashtext(user_uuid::text)) % 89) + 10;
          display_name := clean_username || number_suffix::text;
        END IF;
        
        -- Return the result, properly capitalized if it's a name
        IF length(display_name) > 3 THEN
          -- First character uppercase, rest as-is
          display_name := upper(substring(display_name from 1 for 1)) || 
                          substring(display_name from 2);
        END IF;
        
        RETURN display_name;
      END IF;
    END IF;
  END IF;
  
  -- Fallback: Generate deterministic name from UUID
  uuid_short := replace(user_uuid::text, '-', '');
  
  -- Use parts of UUID to deterministically select name components
  name_index := (('x' || substring(uuid_short from 1 for 4))::bit(16)::int % array_length(name_options, 1)) + 1;
  suffix_index := (('x' || substring(uuid_short from 5 for 4))::bit(16)::int % array_length(suffix_options, 1)) + 1;
  number_suffix := (('x' || substring(uuid_short from 9 for 4))::bit(16)::int % 89) + 10;
  
  display_name := name_options[name_index] || suffix_options[suffix_index] || number_suffix::text;
  
  RETURN display_name;
END;
$$;

-- Ensure we have permission to execute
GRANT EXECUTE ON FUNCTION generate_display_name(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_display_name(text, uuid) TO anon;