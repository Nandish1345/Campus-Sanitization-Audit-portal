-- RLS FIXES FOR STAFF TASK VISIBILITY

-- 1. Update Complaint SELECT Policy
-- Drop the restrictive policy
DROP POLICY IF EXISTS "View Complaints" ON public.complaints;
DROP POLICY IF EXISTS "Users can view own complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admins can view all complaints" ON public.complaints;

-- Create comprehensive SELECT policy
CREATE POLICY "Complaints Visibility" 
ON public.complaints FOR SELECT 
USING (
  auth.uid() = user_id -- Creator can see
  OR 
  auth.uid() = assigned_to -- Assigned Staff can see
  OR 
  EXISTS ( -- Admin can see all
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'
  )
);

-- 2. Update Complaint UPDATE Policy
DROP POLICY IF EXISTS "Admin Update Complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admins can update complaints" ON public.complaints;

CREATE POLICY "Complaints Management" 
ON public.complaints FOR UPDATE 
USING (
  auth.uid() = assigned_to -- Assigned Staff can update
  OR 
  EXISTS ( -- Admin can update all
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'
  )
);

-- 3. Storage Policies for Evidence Photos
-- Allow Staff to see evidence photos in storage
DROP POLICY IF EXISTS "Staff and Admin can view files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all files" ON storage.objects;

CREATE POLICY "Complaint Evidence Visibility"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'complaint-photos' 
  AND (
    auth.jwt() -> 'user_metadata' ->> 'role' IN ('Admin', 'Staff')
    OR
    (SELECT auth.uid()) IN (SELECT user_id FROM public.complaints)
  )
);
