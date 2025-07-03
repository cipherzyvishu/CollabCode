-- Fix Schema Issues for CollabCode
-- This script fixes the missing version column and foreign key issues

-- 1. Add missing 'version' column to code_snapshots table
ALTER TABLE code_snapshots 
ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- 2. Create an index on the version column for better performance
CREATE INDEX IF NOT EXISTS idx_code_snapshots_version 
ON code_snapshots(session_id, version DESC);

-- 3. Fix session_participants table - ensure proper foreign key to user_profiles
-- First, let's check if the foreign key constraint exists and fix it
ALTER TABLE session_participants 
DROP CONSTRAINT IF EXISTS session_participants_user_id_fkey;

-- Add the correct foreign key constraint
ALTER TABLE session_participants 
ADD CONSTRAINT session_participants_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

-- 4. Update any existing code_snapshots to have proper version numbers
-- This will set version numbers based on saved_at order
WITH ranked_snapshots AS (
  SELECT 
    id,
    session_id,
    ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY saved_at) as new_version
  FROM code_snapshots
  WHERE version = 1 -- Only update default versions
)
UPDATE code_snapshots 
SET version = ranked_snapshots.new_version
FROM ranked_snapshots
WHERE code_snapshots.id = ranked_snapshots.id;

-- 5. Verify the schema is correct
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('code_snapshots', 'session_participants')
ORDER BY table_name, ordinal_position;

-- 6. Test the problematic queries
-- Test code_snapshots query
SELECT COUNT(*) as code_snapshots_count 
FROM code_snapshots 
WHERE session_id = '24e55a30-579e-4607-9392-f6e7388754e9';

-- Test session_participants join query  
SELECT COUNT(*) as participants_count
FROM session_participants sp
JOIN user_profiles up ON sp.user_id = up.user_id
WHERE sp.session_id = '24e55a30-579e-4607-9392-f6e7388754e9';
