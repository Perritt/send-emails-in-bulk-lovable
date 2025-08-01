-- Delete the existing test user and create a new one with correct password
DELETE FROM auth.users WHERE email = 'test@example.com';

-- Create test user using Supabase's built-in function for proper password hashing
SELECT auth.create_user(
  'test@example.com',      -- email
  '123456',                -- password
  NULL,                    -- email_confirm (will be auto-confirmed)
  NULL,                    -- phone
  NULL,                    -- phone_confirm
  '{"provider":"email","providers":["email"]}'::jsonb, -- raw_app_meta_data
  '{}'::jsonb              -- raw_user_meta_data
);