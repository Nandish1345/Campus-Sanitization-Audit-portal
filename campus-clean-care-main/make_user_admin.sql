-- Replace 'YOUR_EMAIL_HERE' with the email address you want to make an admin
-- Run this in your Supabase SQL Editor

UPDATE auth.users
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "Admin"}'::jsonb
WHERE email = 'nandishdgnandi@gmail.com';

-- To check if it worked, run this afterwards:
-- SELECT email, raw_user_meta_data->>'role' as role FROM auth.users WHERE email = 'YOUR_EMAIL_HERE';
