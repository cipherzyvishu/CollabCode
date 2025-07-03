-- Comprehensive RLS policies for session_participants table

-- First, disable RLS temporarily to clean up
ALTER TABLE public.session_participants DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable read access for session participants" ON public.session_participants;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.session_participants;
DROP POLICY IF EXISTS "Enable update for participants" ON public.session_participants;
DROP POLICY IF EXISTS "Users can view session participants" ON public.session_participants;
DROP POLICY IF EXISTS "Users can join sessions" ON public.session_participants;
DROP POLICY IF EXISTS "Users can update own participation" ON public.session_participants;

-- Re-enable RLS
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;

-- Policy 1: SELECT - Users can view participants if they are the session owner OR they are a participant
CREATE POLICY "Users can view session participants"
ON public.session_participants
FOR SELECT
TO authenticated
USING (
  -- User is the session owner
  EXISTS (
    SELECT 1 FROM public.sessions s 
    WHERE s.id = session_participants.session_id 
    AND s.created_by = auth.uid()
  )
  OR
  -- User is a participant in the session
  EXISTS (
    SELECT 1 FROM public.session_participants sp2
    WHERE sp2.session_id = session_participants.session_id
    AND sp2.user_id = auth.uid()
  )
);

-- Policy 2: INSERT - Authenticated users can join sessions
CREATE POLICY "Users can join sessions"
ON public.session_participants
FOR INSERT
TO authenticated
WITH CHECK (
  -- User can only add themselves as a participant
  user_id = auth.uid()
  AND
  -- Session must exist and be active
  EXISTS (
    SELECT 1 FROM public.sessions s 
    WHERE s.id = session_id 
    AND s.is_active = true
  )
);

-- Policy 3: UPDATE - Users can update their own participation record
CREATE POLICY "Users can update own participation"
ON public.session_participants
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy 4: DELETE - Users can remove themselves from sessions, session owners can remove others
CREATE POLICY "Users can leave sessions"
ON public.session_participants
FOR DELETE
TO authenticated
USING (
  -- User can remove themselves
  user_id = auth.uid()
  OR
  -- Session owner can remove participants
  EXISTS (
    SELECT 1 FROM public.sessions s 
    WHERE s.id = session_participants.session_id 
    AND s.created_by = auth.uid()
  )
);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_participants TO authenticated;

-- Also ensure user_profiles table has proper RLS for the join to work
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing user_profiles policies
DROP POLICY IF EXISTS "Users can view profiles" ON public.user_profiles;

-- Allow authenticated users to view user profiles (needed for joins)
CREATE POLICY "Users can view profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (true);

GRANT SELECT ON public.user_profiles TO authenticated;
