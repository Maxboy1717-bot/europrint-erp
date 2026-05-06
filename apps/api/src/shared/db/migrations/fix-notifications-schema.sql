-- Migration: fix-notifications-schema.sql
-- Maqsad: Backend kod kutgan ustunlarga DB schema'ni moslash.
-- Mismatch:
--   DB:    read, message
--   Code:  is_read, body, reference_id, reference_type

-- 1. Rename: read → is_read
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='notifications' AND column_name='read')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_name='notifications' AND column_name='is_read') THEN
    ALTER TABLE notifications RENAME COLUMN read TO is_read;
  END IF;
END$$;

-- 2. Rename: message → body
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='notifications' AND column_name='message')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_name='notifications' AND column_name='body') THEN
    ALTER TABLE notifications RENAME COLUMN message TO body;
  END IF;
END$$;

-- 3. Add missing: reference_id, reference_type
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_id integer;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_type varchar(50);

-- 4. Index for is_read filter
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, is_read, created_at DESC)
  WHERE is_read = false;

-- 5. Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'notifications' ORDER BY ordinal_position;
