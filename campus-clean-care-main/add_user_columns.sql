-- Add columns to store user details directly on the complaint
-- This avoids complex joins if we don't have a public profiles table
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS user_name TEXT;
