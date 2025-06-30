-- Check if code snapshots are being saved
-- Run this in Supabase SQL editor to see code snapshots

SELECT 
    cs.id,
    cs.session_id,
    cs.version_number,
    LEFT(cs.code, 100) as code_preview,
    cs.language,
    cs.saved_by,
    cs.is_auto_save,
    cs.saved_at,
    s.title as session_title
FROM code_snapshots cs
JOIN sessions s ON cs.session_id = s.id
ORDER BY cs.saved_at DESC
LIMIT 10;
