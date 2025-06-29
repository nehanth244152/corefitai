-- Drop existing function
DROP FUNCTION IF EXISTS generate_display_name(text, uuid);

-- Create improved version that preserves original usernames including numbers
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
      -- Keep alphanumeric characters but remove most special chars (except underscore and dot)
      clean_username := regexp_replace(email_username, '[^a-zA-Z0-9_.]', '', 'g');
      
      -- Replace dots and underscores with empty string - simply remove them
      clean_username := regexp_replace(clean_username, '[_.]', '', 'g');
      
      -- If the username still has content, use it
      IF length(clean_username) > 0 THEN
        -- First character uppercase, rest as-is
        display_name := upper(substring(clean_username from 1 for 1)) || 
                        substring(clean_username from 2);
        
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