-- Migration: Add resolution_photo_name column to complaints
-- Run this in the Supabase SQL Editor

ALTER TABLE complaints
  ADD COLUMN IF NOT EXISTS resolution_photo_name TEXT DEFAULT NULL;

COMMENT ON COLUMN complaints.resolution_photo_name
  IS 'Path in complaint-photos bucket for staff done-work evidence photo';
