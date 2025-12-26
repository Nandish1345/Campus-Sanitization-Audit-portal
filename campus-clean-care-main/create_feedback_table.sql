-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    email TEXT,
    message TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone (even anon) to insert feedback
CREATE POLICY "Allow public feedback submission" 
ON feedback FOR INSERT 
TO public, anon, authenticated 
WITH CHECK (true);

-- Policy: Allow Admins to read feedback
CREATE POLICY "Allow Admin to view feedback" 
ON feedback FOR SELECT 
TO authenticated 
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'Admin'
);
