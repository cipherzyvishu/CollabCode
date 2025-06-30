-- CollabCode Database Schema
-- Complete Supabase PostgreSQL setup (Idempotent)
-- Version: 2.0

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables in reverse dependency order to avoid conflicts
DROP TABLE IF EXISTS session_activity CASCADE;
DROP TABLE IF EXISTS collaboration_state CASCADE;
DROP TABLE IF EXISTS code_snapshots CASCADE;
DROP TABLE IF EXISTS session_participants CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS session_templates CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS get_session_with_participants(UUID);
DROP FUNCTION IF EXISTS join_session(UUID, TEXT);
DROP FUNCTION IF EXISTS leave_session(UUID);
DROP FUNCTION IF EXISTS save_code_snapshot(UUID, TEXT, BOOLEAN, TEXT);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Create sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    language TEXT NOT NULL DEFAULT 'typescript',
    template_type TEXT DEFAULT 'blank',
    max_participants INTEGER DEFAULT 10,
    is_public BOOLEAN DEFAULT false,
    requires_approval BOOLEAN DEFAULT false,
    session_code TEXT UNIQUE NOT NULL DEFAULT UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6)),
    current_code TEXT DEFAULT '',
    starter_code TEXT DEFAULT '',
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Create session templates table
CREATE TABLE session_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    language TEXT NOT NULL,
    starter_code TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usage_count INTEGER DEFAULT 0
);

-- Create session participants table
CREATE TABLE session_participants (
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'participant',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    cursor_position JSONB DEFAULT '{}',
    PRIMARY KEY (session_id, user_id),
    CONSTRAINT valid_role CHECK (role IN ('owner', 'moderator', 'participant'))
);

-- Create code snapshots table
CREATE TABLE code_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    version_number INTEGER DEFAULT 1,
    code TEXT NOT NULL,
    language TEXT NOT NULL,
    saved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_auto_save BOOLEAN DEFAULT true,
    change_summary TEXT,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create session activity logs table
CREATE TABLE session_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL,
    activity_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_activity_type CHECK (activity_type IN ('join', 'leave', 'code_edit', 'run_code', 'message', 'cursor_move'))
);

-- Create collaboration state table
CREATE TABLE collaboration_state (
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE PRIMARY KEY,
    current_code TEXT DEFAULT '',
    current_version INTEGER DEFAULT 1,
    y_js_state JSONB DEFAULT '{}',
    last_edit_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    last_edit_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cursor_positions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user profiles table
CREATE TABLE user_profiles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    display_name TEXT,
    avatar_url TEXT,
    avatar_color TEXT DEFAULT '#3B82F6',
    bio TEXT,
    preferred_language TEXT DEFAULT 'typescript',
    editor_theme TEXT DEFAULT 'vs-dark',
    auto_save_interval INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_sessions_created_by ON sessions(created_by);
CREATE INDEX idx_sessions_language ON sessions(language);
CREATE INDEX idx_sessions_is_public ON sessions(is_public);
CREATE INDEX idx_sessions_is_active ON sessions(is_active);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX idx_sessions_last_activity ON sessions(last_activity DESC);
CREATE INDEX idx_sessions_session_code ON sessions(session_code);

CREATE INDEX idx_session_templates_language ON session_templates(language);
CREATE INDEX idx_session_templates_is_public ON session_templates(is_public);
CREATE INDEX idx_session_templates_usage_count ON session_templates(usage_count DESC);
CREATE INDEX idx_session_templates_created_by ON session_templates(created_by);
CREATE INDEX idx_session_templates_name ON session_templates(name);

CREATE INDEX idx_session_participants_session_id ON session_participants(session_id);
CREATE INDEX idx_session_participants_user_id ON session_participants(user_id);
CREATE INDEX idx_session_participants_role ON session_participants(role);
CREATE INDEX idx_session_participants_is_active ON session_participants(is_active);
CREATE INDEX idx_session_participants_last_seen ON session_participants(last_seen DESC);

CREATE INDEX idx_code_snapshots_session_id ON code_snapshots(session_id);
CREATE INDEX idx_code_snapshots_version_number ON code_snapshots(session_id, version_number DESC);
CREATE INDEX idx_code_snapshots_saved_by ON code_snapshots(saved_by);
CREATE INDEX idx_code_snapshots_saved_at ON code_snapshots(saved_at DESC);
CREATE INDEX idx_code_snapshots_is_auto_save ON code_snapshots(is_auto_save);

CREATE INDEX idx_session_activity_session_id ON session_activity(session_id);
CREATE INDEX idx_session_activity_user_id ON session_activity(user_id);
CREATE INDEX idx_session_activity_type ON session_activity(activity_type);
CREATE INDEX idx_session_activity_created_at ON session_activity(created_at DESC);

CREATE INDEX idx_collaboration_state_session_id ON collaboration_state(session_id);
CREATE INDEX idx_collaboration_state_last_edit_at ON collaboration_state(last_edit_at DESC);
CREATE INDEX idx_collaboration_state_last_edit_by ON collaboration_state(last_edit_by);

CREATE INDEX idx_user_profiles_display_name ON user_profiles(display_name);
CREATE INDEX idx_user_profiles_preferred_language ON user_profiles(preferred_language);

-- Enable Row Level Security on all tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Sessions RLS Policies
CREATE POLICY "sessions_select_policy" ON sessions
    FOR SELECT USING (
        -- Session creator can see it
        auth.uid() = created_by OR 
        -- Session participants can see it
        auth.uid() IN (
            SELECT user_id FROM session_participants 
            WHERE session_id = sessions.id AND is_active = true
        ) OR
        -- Public sessions are visible to everyone
        is_public = true
    );

CREATE POLICY "sessions_insert_policy" ON sessions
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "sessions_update_policy" ON sessions
    FOR UPDATE USING (
        auth.uid() = created_by OR
        auth.uid() IN (
            SELECT user_id FROM session_participants 
            WHERE session_id = sessions.id AND role IN ('owner', 'moderator')
        )
    );

CREATE POLICY "sessions_delete_policy" ON sessions
    FOR DELETE USING (auth.uid() = created_by);

-- Session Templates RLS Policies
CREATE POLICY "session_templates_select_policy" ON session_templates
    FOR SELECT USING (
        is_public = true OR 
        auth.uid() = created_by
    );

CREATE POLICY "session_templates_insert_policy" ON session_templates
    FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "session_templates_update_policy" ON session_templates
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "session_templates_delete_policy" ON session_templates
    FOR DELETE USING (auth.uid() = created_by);

-- Session Participants RLS Policies
CREATE POLICY "session_participants_select_policy" ON session_participants
    FOR SELECT USING (
        -- User can see their own participation
        user_id = auth.uid() OR
        -- Session owner can see all participants
        session_id IN (SELECT id FROM sessions WHERE created_by = auth.uid()) OR
        -- Other participants in same session can see each other
        session_id IN (
            SELECT session_id FROM session_participants 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "session_participants_insert_policy" ON session_participants
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR
        -- Session owner can add participants
        session_id IN (SELECT id FROM sessions WHERE created_by = auth.uid())
    );

CREATE POLICY "session_participants_update_policy" ON session_participants
    FOR UPDATE USING (
        auth.uid() = user_id OR
        session_id IN (SELECT id FROM sessions WHERE created_by = auth.uid())
    );

CREATE POLICY "session_participants_delete_policy" ON session_participants
    FOR DELETE USING (
        auth.uid() = user_id OR
        session_id IN (SELECT id FROM sessions WHERE created_by = auth.uid())
    );

-- Code Snapshots RLS Policies
CREATE POLICY "code_snapshots_select_policy" ON code_snapshots
    FOR SELECT USING (
        session_id IN (
            SELECT session_id FROM session_participants 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "code_snapshots_insert_policy" ON code_snapshots
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT session_id FROM session_participants 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "code_snapshots_update_policy" ON code_snapshots
    FOR UPDATE USING (
        auth.uid() = saved_by OR
        session_id IN (SELECT id FROM sessions WHERE created_by = auth.uid())
    );

CREATE POLICY "code_snapshots_delete_policy" ON code_snapshots
    FOR DELETE USING (
        auth.uid() = saved_by OR
        session_id IN (SELECT id FROM sessions WHERE created_by = auth.uid())
    );

-- Session Activity RLS Policies
CREATE POLICY "session_activity_select_policy" ON session_activity
    FOR SELECT USING (
        session_id IN (
            SELECT session_id FROM session_participants 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "session_activity_insert_policy" ON session_activity
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        session_id IN (
            SELECT session_id FROM session_participants 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Collaboration State RLS Policies
CREATE POLICY "collaboration_state_select_policy" ON collaboration_state
    FOR SELECT USING (
        session_id IN (
            SELECT session_id FROM session_participants 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "collaboration_state_insert_policy" ON collaboration_state
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT session_id FROM session_participants 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "collaboration_state_update_policy" ON collaboration_state
    FOR UPDATE USING (
        session_id IN (
            SELECT session_id FROM session_participants 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- User Profiles RLS Policies
CREATE POLICY "user_profiles_select_policy" ON user_profiles
    FOR SELECT USING (
        auth.uid() = user_id OR
        -- Allow viewing profiles of users in same sessions
        user_id IN (
            SELECT DISTINCT sp2.user_id 
            FROM session_participants sp1 
            JOIN session_participants sp2 ON sp1.session_id = sp2.session_id 
            WHERE sp1.user_id = auth.uid() AND sp1.is_active = true AND sp2.is_active = true
        )
    );

CREATE POLICY "user_profiles_insert_policy" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_profiles_update_policy" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_profiles_delete_policy" ON user_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Create utility functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collaboration_state_updated_at
    BEFORE UPDATE ON collaboration_state
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Business logic functions
CREATE OR REPLACE FUNCTION get_session_with_participants(session_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'id', s.id,
        'title', s.title,
        'description', s.description,
        'language', s.language,
        'template_type', s.template_type,
        'max_participants', s.max_participants,
        'is_public', s.is_public,
        'requires_approval', s.requires_approval,
        'session_code', s.session_code,
        'current_code', s.current_code,
        'starter_code', s.starter_code,
        'created_by', s.created_by,
        'created_at', s.created_at,
        'updated_at', s.updated_at,
        'last_activity', s.last_activity,
        'is_active', s.is_active,
        'participant_count', COALESCE(
            (SELECT COUNT(*) FROM session_participants sp 
             WHERE sp.session_id = s.id AND sp.is_active = true), 0
        ),
        'participants', COALESCE(
            (SELECT json_agg(
                json_build_object(
                    'user_id', sp.user_id,
                    'role', sp.role,
                    'joined_at', sp.joined_at,
                    'last_seen', sp.last_seen,
                    'is_active', sp.is_active,
                    'cursor_position', sp.cursor_position
                )
            ) FROM session_participants sp 
            WHERE sp.session_id = s.id AND sp.is_active = true),
            '[]'::json
        )
    ) INTO result
    FROM sessions s
    WHERE s.id = session_uuid AND s.is_active = true;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION join_session(session_uuid UUID, join_code TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    session_record sessions%ROWTYPE;
    participant_count INTEGER;
    user_uuid UUID;
BEGIN
    -- Get current user ID
    user_uuid := auth.uid();
    
    IF user_uuid IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User not authenticated');
    END IF;
    
    -- Get session details
    SELECT * INTO session_record 
    FROM sessions 
    WHERE id = session_uuid 
    AND (join_code IS NULL OR session_code = join_code)
    AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Session not found or invalid code');
    END IF;
    
    -- Check participant limit
    SELECT COUNT(*) INTO participant_count 
    FROM session_participants 
    WHERE session_id = session_uuid AND is_active = true;
    
    IF participant_count >= session_record.max_participants THEN
        RETURN json_build_object('success', false, 'error', 'Session is full');
    END IF;
    
    -- Insert or update participant
    INSERT INTO session_participants (session_id, user_id, last_seen, is_active)
    VALUES (session_uuid, user_uuid, NOW(), true)
    ON CONFLICT (session_id, user_id)
    DO UPDATE SET is_active = true, last_seen = NOW(), joined_at = NOW();
    
    -- Log activity
    INSERT INTO session_activity (session_id, user_id, activity_type)
    VALUES (session_uuid, user_uuid, 'join');
    
    -- Update session last activity
    UPDATE sessions SET last_activity = NOW() WHERE id = session_uuid;
    
    RETURN json_build_object(
        'success', true, 
        'session_id', session_record.id,
        'session_code', session_record.session_code
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION leave_session(session_uuid UUID)
RETURNS JSON AS $$
DECLARE
    user_uuid UUID;
BEGIN
    user_uuid := auth.uid();
    
    IF user_uuid IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User not authenticated');
    END IF;
    
    -- Update participant status
    UPDATE session_participants 
    SET is_active = false, last_seen = NOW()
    WHERE session_id = session_uuid AND user_id = user_uuid;
    
    -- Log activity
    INSERT INTO session_activity (session_id, user_id, activity_type)
    VALUES (session_uuid, user_uuid, 'leave');
    
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION save_code_snapshot(
    session_uuid UUID, 
    code_content TEXT, 
    is_auto BOOLEAN DEFAULT true,
    summary TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    new_version INTEGER;
    snapshot_id UUID;
    session_language TEXT;
    user_uuid UUID;
BEGIN
    user_uuid := auth.uid();
    
    IF user_uuid IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User not authenticated');
    END IF;
    
    -- Get session language and next version number
    SELECT language INTO session_language FROM sessions WHERE id = session_uuid;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Session not found');
    END IF;
    
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO new_version
    FROM code_snapshots 
    WHERE session_id = session_uuid;
    
    -- Insert new snapshot
    INSERT INTO code_snapshots (
        session_id, 
        version_number, 
        code, 
        language,
        saved_by, 
        is_auto_save, 
        change_summary,
        saved_at
    ) VALUES (
        session_uuid,
        new_version,
        code_content,
        session_language,
        user_uuid,
        is_auto,
        summary,
        NOW()
    ) RETURNING id INTO snapshot_id;
    
    -- Update collaboration state
    INSERT INTO collaboration_state (session_id, current_code, current_version, last_edit_by, last_edit_at)
    VALUES (session_uuid, code_content, new_version, user_uuid, NOW())
    ON CONFLICT (session_id)
    DO UPDATE SET 
        current_code = EXCLUDED.current_code,
        current_version = EXCLUDED.current_version,
        last_edit_by = EXCLUDED.last_edit_by,
        last_edit_at = EXCLUDED.last_edit_at;
    
    -- Update session last activity
    UPDATE sessions SET 
        last_activity = NOW(),
        current_code = code_content
    WHERE id = session_uuid;
    
    -- Log activity
    INSERT INTO session_activity (session_id, user_id, activity_type, activity_data)
    VALUES (session_uuid, user_uuid, 'code_edit', 
            json_build_object('version', new_version, 'auto_save', is_auto));
    
    RETURN json_build_object(
        'success', true, 
        'snapshot_id', snapshot_id, 
        'version', new_version
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample session templates
INSERT INTO session_templates (name, description, language, starter_code, tags, is_public, created_by) VALUES
(
    'React TypeScript Component',
    'A basic React component template with TypeScript',
    'typescript',
    '// Welcome to CollabCode - React TypeScript Session!
import React, { useState } from ''react'';

interface Props {
  title: string;
}

const CollaborativeComponent: React.FC<Props> = ({ title }) => {
  const [count, setCount] = useState(0);
  
  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <p className="mb-4">Count: {count}</p>
      <button 
        onClick={() => setCount(count + 1)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Increment
      </button>
    </div>
  );
};

export default CollaborativeComponent;

// Start building something amazing together!',
    ARRAY['react', 'typescript', 'component'],
    true,
    NULL
),
(
    'JavaScript ES6 Playground',
    'Modern JavaScript with ES6+ features',
    'javascript',
    '// Welcome to CollabCode - JavaScript Session!
const CollaborativeApp = () => {
  let count = 0;
  
  const increment = () => {
    count++;
    updateDisplay();
  };
  
  const updateDisplay = () => {
    const countElement = document.getElementById(''count'');
    if (countElement) {
      countElement.textContent = count.toString();
    }
  };
  
  return {
    increment,
    getCount: () => count
  };
};

// Initialize the app
const app = CollaborativeApp();

// Start coding here!
console.log(''Welcome to collaborative coding!'');',
    ARRAY['javascript', 'es6', 'playground'],
    true,
    NULL
),
(
    'Python Data Science',
    'Python template for data analysis and visualization',
    'python',
    '# Welcome to CollabCode - Python Data Science Session!
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

def analyze_data():
    """
    Template for data analysis workflow
    """
    print("Hello from CollabCode Data Science!")
    
    # Sample data creation
    data = {
        ''name'': [''Alice'', ''Bob'', ''Charlie'', ''Diana''],
        ''age'': [25, 30, 35, 28],
        ''score'': [85, 92, 88, 95]
    }
    
    df = pd.DataFrame(data)
    print("Sample DataFrame:")
    print(df)
    
    # Basic analysis
    print(f"\\nAverage age: {df[''age''].mean():.1f}")
    print(f"Average score: {df[''score''].mean():.1f}")
    
    return df

if __name__ == "__main__":
    result = analyze_data()
    # Start your data analysis here!',
    ARRAY['python', 'data-science', 'pandas', 'analysis'],
    true,
    NULL
),
(
    'HTML CSS JavaScript Web Page',
    'Complete web page template with HTML, CSS, and JavaScript',
    'html',
    '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CollabCode Web Project</title>
    <style>
        body {
            font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        
        .container {
            background: rgba(255, 255, 255, 0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        
        .counter {
            text-align: center;
            margin: 30px 0;
        }
        
        button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 16px;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        button:hover {
            background: #45a049;
        }
        
        #count {
            font-size: 2em;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Welcome to CollabCode!</h1>
        <p>Start building something amazing together!</p>
        
        <div class="counter">
            <h2>Interactive Counter</h2>
            <div id="count">0</div>
            <button onclick="increment()">Click me!</button>
        </div>
    </div>

    <script>
        let count = 0;
        
        function increment() {
            count++;
            document.getElementById(''count'').textContent = count;
        }
        
        // Add your JavaScript here!
    </script>
</body>
</html>',
    ARRAY['html', 'css', 'javascript', 'web', 'frontend'],
    true,
    NULL
),
(
    'Node.js Express Server',
    'A basic Express.js server setup',
    'javascript',
    '// Welcome to CollabCode - Node.js Express Server!
const express = require(''express'');
const cors = require(''cors'');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(''public''));

// Routes
app.get(''/api/health'', (req, res) => {
  res.json({ 
    status: ''healthy'', 
    timestamp: new Date().toISOString(),
    message: ''CollabCode Express Server is running!''
  });
});

app.get(''/api/hello'', (req, res) => {
  const { name = ''World'' } = req.query;
  res.json({ 
    message: `Hello, ${name}!`,
    timestamp: new Date().toISOString()
  });
});

app.post(''/api/echo'', (req, res) => {
  res.json({
    received: req.body,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

// Start building your API here!',
    ARRAY['nodejs', 'express', 'server', 'api'],
    true,
    NULL
);

-- Final verification and completion message
DO $$
BEGIN
    -- Verify all tables were created
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions') THEN
        RAISE EXCEPTION 'Failed to create sessions table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'session_participants') THEN
        RAISE EXCEPTION 'Failed to create session_participants table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'code_snapshots') THEN
        RAISE EXCEPTION 'Failed to create code_snapshots table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'session_templates') THEN
        RAISE EXCEPTION 'Failed to create session_templates table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'session_activity') THEN
        RAISE EXCEPTION 'Failed to create session_activity table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collaboration_state') THEN
        RAISE EXCEPTION 'Failed to create collaboration_state table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        RAISE EXCEPTION 'Failed to create user_profiles table';
    END IF;
    
    -- Verify critical columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'is_active') THEN
        RAISE EXCEPTION 'sessions.is_active column missing';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'session_participants' AND column_name = 'is_active') THEN
        RAISE EXCEPTION 'session_participants.is_active column missing';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'code_snapshots' AND column_name = 'version_number') THEN
        RAISE EXCEPTION 'code_snapshots.version_number column missing';
    END IF;
    
    -- Verify functions exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_session_with_participants') THEN
        RAISE EXCEPTION 'get_session_with_participants function missing';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'join_session') THEN
        RAISE EXCEPTION 'join_session function missing';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'save_code_snapshot') THEN
        RAISE EXCEPTION 'save_code_snapshot function missing';
    END IF;
    
    -- Check if sample templates were inserted
    IF (SELECT COUNT(*) FROM session_templates) = 0 THEN
        RAISE WARNING 'No sample templates found - they may have been skipped due to conflicts';
    ELSE
        RAISE NOTICE 'Sample templates inserted successfully: % templates', (SELECT COUNT(*) FROM session_templates);
    END IF;
    
    RAISE NOTICE '✅ CollabCode database schema setup completed successfully!';
    RAISE NOTICE '📋 Tables created: sessions, session_participants, code_snapshots, session_templates, session_activity, collaboration_state, user_profiles';
    RAISE NOTICE '🔒 Row Level Security enabled on all tables';
    RAISE NOTICE '⚡ Performance indexes created';
    RAISE NOTICE '🔧 Business logic functions ready';
    RAISE NOTICE '📊 Sample data inserted';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Ready to test CollabCode application!';
END $$;
