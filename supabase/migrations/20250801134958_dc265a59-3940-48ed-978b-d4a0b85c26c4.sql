-- Delete existing test user
DELETE FROM auth.users WHERE email = 'test@example.com';

-- Create test user with properly hashed password using Supabase's extension
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_sent_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('123456', gen_salt('bf')),  -- Use bcrypt to properly hash the password
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  now(),
  now()
);