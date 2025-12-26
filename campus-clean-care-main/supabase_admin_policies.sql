-- Enable RLS on the table if not already enabled (it should be)
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- 1. TABLE POLICIES
-- Drop existing policies to avoid "already exists" errors
DROP POLICY IF EXISTS "Admins can view all complaints" ON complaints;
DROP POLICY IF EXISTS "Admins can update complaints" ON complaints;

-- Policy to allow Admins to view ALL complaints
-- This assumes you have set the "role": "Admin" in the user's metadata
CREATE POLICY "Admins can view all complaints"
  ON complaints
  FOR SELECT
  USING (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'Admin'
  );

-- Policy to allow Admins to update complaints (to change status)
CREATE POLICY "Admins can update complaints"
  ON complaints
  FOR UPDATE
  USING (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'Admin'
  );

-- 2. STORAGE POLICIES
-- Drop existing storage policies if any to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all files" ON storage.objects;

-- Policy to allow Admins to view ALL files in the 'complaint-photos' bucket
CREATE POLICY "Admins can view all files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'complaint-photos' 
  AND auth.jwt() -> 'user_metadata' ->> 'role' = 'Admin'
);
