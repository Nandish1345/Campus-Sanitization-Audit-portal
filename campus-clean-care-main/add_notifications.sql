-- ============================================================
-- Migration: In-App Notification System
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'info',   -- 'info' | 'success' | 'warning'
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  complaint_id UUID REFERENCES complaints(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Index for fast per-user lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read  ON notifications(user_id, is_read);

-- 3. Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. Users can only see their own notifications
CREATE POLICY "Users see own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- 5. Any authenticated user can insert notifications (needed for cross-user notify)
CREATE POLICY "Authenticated users can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 6. Users can update (mark read) their own notifications
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- 7. Enable Realtime for the notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
