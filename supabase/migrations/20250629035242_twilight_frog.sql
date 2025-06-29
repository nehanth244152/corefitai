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
  
  -- Fallback names if we can't extract from email
  name_options text[] := ARRAY[
    'Alex', 'Jordan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Sage', 'River', 
    'Blake', 'Drew', 'Rowan', 'Skyler', 'Phoenix', 'Dakota', 'Cameron', 'Finley',
    'Taylor', 'Morgan', 'Jamie', 'Kendall', 'Parker', 'Reese', 'Peyton', 'Bailey',
    'Emery', 'Hayden', 'Jesse', 'Kerry', 'Lesley', 'Maddox', 'Robin', 'Shawn'
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
      
      -- If the username still has content and sufficient length, use it
      IF length(clean_username) >= 3 THEN
        -- First character uppercase, rest as-is
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

-- Ensure we have permission to execute
GRANT EXECUTE ON FUNCTION generate_display_name(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_display_name(text, uuid) TO anon;