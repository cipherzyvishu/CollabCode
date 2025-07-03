-- Test if code_snapshots table exists and check its structure
-- Run this in Supabase SQL editor

-- First, let's see if the table exists
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'code_snapshots' 
ORDER BY ordinal_position;

-- Check if there are any code snapshots
SELECT COUNT(*) as total_snapshots FROM code_snapshots;

-- Check sessions table to see if we have any sessions
SELECT id, title, language, created_at FROM sessions LIMIT 5;
