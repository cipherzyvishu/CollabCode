export interface User {
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
    created_at: string;
}
export interface Session {
    id: string;
    title: string;
    language: string;
    created_by: string;
    created_at: string;
    updated_at: string;
}
export interface SessionParticipant {
    session_id: string;
    user_id: string;
    joined_at: string;
    user?: User;
}
export interface CodeSnapshot {
    id: string;
    session_id: string;
    code: string;
    saved_at: string;
}
export interface ServerToClientEvents {
    codeChange: (data: {
        code: string;
        userId: string;
    }) => void;
    userJoined: (data: {
        user: User;
    }) => void;
    userLeft: (data: {
        userId: string;
    }) => void;
    cursorMove: (data: {
        userId: string;
        position: {
            line: number;
            column: number;
        };
    }) => void;
    aiResponse: (data: {
        explanation: string;
        userId: string;
    }) => void;
    'code-change': (data: {
        code: string;
        userId: string;
        timestamp?: string;
    }) => void;
    'cursor-change': (data: {
        position: {
            lineNumber: number;
            column: number;
        };
        userId: string;
        userName: string;
        timestamp?: string;
    }) => void;
    'user-joined': (data: {
        user: {
            id: string;
            name: string;
            avatar?: string;
        };
        participantCount: number;
    }) => void;
    'user-left': (data: {
        userId: string;
        participantCount: number;
    }) => void;
    'session-state': (data: {
        code: string;
        participants: Array<{
            id: string;
            name: string;
            joinedAt: string;
        }>;
    }) => void;
}
export interface ClientToServerEvents {
    joinSession: (data: {
        sessionId: string;
        userId: string;
    }) => void;
    leaveSession: (data: {
        sessionId: string;
        userId: string;
    }) => void;
    codeChange: (data: {
        sessionId: string;
        code: string;
        userId: string;
    }) => void;
    cursorMove: (data: {
        sessionId: string;
        position: {
            line: number;
            column: number;
        };
        userId: string;
    }) => void;
    requestAI: (data: {
        sessionId: string;
        code: string;
        userId: string;
    }) => void;
    'code-change': (data: {
        sessionId: string;
        code: string;
        userId: string;
    }) => void;
    'cursor-change': (data: {
        sessionId: string;
        position: {
            lineNumber: number;
            column: number;
        };
        userId: string;
        userName: string;
    }) => void;
    'join-session': (sessionId: string, userInfo?: {
        name: string;
        avatar?: string;
    }) => void;
    'leave-session': (sessionId: string) => void;
}
export type ProgrammingLanguage = 'javascript' | 'typescript' | 'python' | 'java' | 'cpp' | 'csharp' | 'go' | 'rust' | 'php' | 'ruby' | 'html' | 'css';
export interface AIExplainRequest {
    code: string;
}
export interface AIExplainResponse {
    explanation: string;
}
export interface VoiceUser {
    userId: string;
    isConnected: boolean;
    isMuted: boolean;
}
export interface EditorState {
    code: string;
    language: ProgrammingLanguage;
    setCode: (code: string) => void;
    setLanguage: (language: ProgrammingLanguage) => void;
}
export interface SessionState {
    currentSession: Session | null;
    participants: SessionParticipant[];
    isConnected: boolean;
    setCurrentSession: (session: Session | null) => void;
    setParticipants: (participants: SessionParticipant[]) => void;
    setIsConnected: (connected: boolean) => void;
}
export interface UserState {
    user: User | null;
    setUser: (user: User | null) => void;
}
//# sourceMappingURL=types.d.ts.map