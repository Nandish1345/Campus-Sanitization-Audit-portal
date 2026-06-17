-- Enable Row Level Security
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- 1. Create Profiles Table (Synced with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'Student', -- 'Student', 'Lecturer', 'Admin', 'Staff'
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, department)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'role', 'Student'),
    new.raw_user_meta_data->>'department'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid duplication errors on multiple runs
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Backfill profiles for existing users (Run this manually if needed, or included here)
INSERT INTO public.profiles (id, full_name, email, role, department)
SELECT 
  id, 
  raw_user_meta_data->>'full_name', 
  email, 
  COALESCE(raw_user_meta_data->>'role', 'Student'),
  raw_user_meta_data->>'department'
FROM auth.users
ON CONFLICT (id) DO NOTHING;


-- 2. Update Complaints Table

-- Add new columns
ALTER TABLE public.complaints 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Critical'
ADD COLUMN IF NOT EXISTS category TEXT, -- 'Cleaning', 'Electrical', etc.
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update constraints/default
ALTER TABLE public.complaints 
ALTER COLUMN status SET DEFAULT 'Pending';

-- Check constraint for Priority (Optional but good practice)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'complaints_priority_check') THEN
    ALTER TABLE public.complaints 
    ADD CONSTRAINT complaints_priority_check 
    CHECK (priority IN ('Low', 'Medium', 'High', 'Critical'));
  END IF;
END $$;


-- 3. RLS Policies for Complaints

-- Policy: Users can see only their own complaints OR if they are Admin
-- Note: Simplified policy. For more complex role checks, we might need a helper function.
-- Assuming 'role' metadata is reliable in auth.jwt() or we check profiles.

DROP POLICY IF EXISTS "Users can view own complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admins can view all complaints" ON public.complaints;
DROP POLICY IF EXISTS "Users can insert own complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admins can update complaints" ON public.complaints;

-- View Policy
CREATE POLICY "View Complaints" 
ON public.complaints FOR SELECT 
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'
  )
);

-- Insert Policy (Authenticated users)
CREATE POLICY "Insert Complaints" 
ON public.complaints FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Update Policy (Admins only for status/assignment, Users maybe for details if pending?)
-- For now, restricting updates to Admins or Assigned Staff.
CREATE POLICY "Admin Update Complaints" 
ON public.complaints FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role IN ('Admin', 'Staff')
  )
);
