-- Simple, non-recursive RLS policies for session_participants

-- Disable RLS temporarily to clean up
ALTER TABLE public.session_participants DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable read access for session participants" ON public.session_participants;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.session_participants;
DROP POLICY IF EXISTS "Enable update for participants" ON public.session_participants;
DROP POLICY IF EXISTS "Users can view session participants" ON public.session_participants;
DROP POLICY IF EXISTS "Users can join sessions" ON public.session_participants;
DROP POLICY IF EXISTS "Users can update own participation" ON public.session_participants;
DROP POLICY IF EXISTS "Users can leave sessions" ON public.session_participants;

-- Re-enable RLS
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;

-- Simple SELECT policy - users can see participants for sessions they own or participate in
CREATE POLICY "session_participants_select"
ON public.session_participants
FOR SELECT
TO authenticated
USING (
  -- User owns the session
  session_id IN (
    SELECT id FROM public.sessions 
    WHERE created_by = auth.uid()
  )
  OR
  -- User is a participant in the session
  user_id = auth.uid()
);

-- Simple INSERT policy - users can add themselves to sessions
CREATE POLICY "session_participants_insert"
ON public.session_participants
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
);

-- Simple UPDATE policy - users can update their own participation
CREATE POLICY "session_participants_update"
ON public.session_participants
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Simple DELETE policy - users can remove themselves
CREATE POLICY "session_participants_delete"
ON public.session_participants
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR
  session_id IN (
    SELECT id FROM public.sessions 
    WHERE created_by = auth.uid()
  )
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_participants TO authenticated;

-- Ensure user_profiles has simple RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing user_profiles policies
DROP POLICY IF EXISTS "Users can view profiles" ON public.user_profiles;

-- Simple policy for user_profiles - all authenticated users can read all profiles
CREATE POLICY "user_profiles_select"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (true);

GRANT SELECT ON public.user_profiles TO authenticated;

-- Ensure sessions table has RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing sessions policies
DROP POLICY IF EXISTS "sessions_select" ON public.sessions;

-- Simple policy for sessions - users can see public sessions or their own sessions
CREATE POLICY "sessions_select"
ON public.sessions
FOR SELECT
TO authenticated
USING (
  is_public = true 
  OR 
  created_by = auth.uid()
);

GRANT SELECT ON public.sessions TO authenticated;
