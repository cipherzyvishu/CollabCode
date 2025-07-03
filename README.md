# CollabCode - Real-time Collaborative Coding Platform

A modern, real-time collaborative coding platform built with Next.js, Socket.IO, Monaco Editor, Y.js, and Supabase. CollabCode allows developers to create and join collaborative coding sessions with real-time code synchronization, user presence, and multi-language support.

## 🚀 Features

- **Real-time Collaboration**: Multiple users can edit code simultaneously with conflict-free merging
- **Monaco Editor**: VSCode-like editing experience with syntax highlighting and IntelliSense
- **Y.js Integration**: Conflict-free collaborative editing with operational transforms
- **Socket.IO**: WebSocket-based real-time communication for low latency
- **User Authentication**: Secure login with Supabase Auth (email, password, and OAuth providers)
- **Session Management**: Create, join, and manage coding sessions with access control
- **Code Snapshots**: Version control with auto-save functionality for session history
- **Multi-language Support**: JavaScript, TypeScript, Python, Java, C++, and more
- **Auto-save**: Periodic code snapshots to prevent data loss
- **User Presence**: See who's in your session and their cursor positions
- **Persistent Sessions**: Sessions are stored in a database for later access
- **Session Templates**: Start from pre-defined templates for common tasks

## 🛠️ Tech Stack

- **Frontend**: 
  - [Next.js 15](https://nextjs.org/) - React framework with server components
  - [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
  - [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor powering VS Code
  - [Zustand](https://zustand-demo.pmnd.rs/) - State management
  - [Y.js](https://yjs.dev/) - CRDT for conflict-free collaboration

- **Backend**: 
  - [Socket.IO](https://socket.io/) server for real-time communication
  - [Next.js API routes](https://nextjs.org/docs/api-routes/introduction) for auth and data access
  - [Y-WebSocket](https://github.com/yjs/y-websocket) for Y.js synchronization

- **Database**: 
  - [Supabase PostgreSQL](https://supabase.io/) for data storage
  - Row-level security for data protection

- **Authentication**: 
  - [Supabase Auth](https://supabase.com/docs/guides/auth) with email/password and OAuth

- **Additional Features**:
  - [HuggingFace Inference API](https://huggingface.co/inference-api) for AI code assistance
  - [WebRTC](https://webrtc.org/) + [Simple-Peer](https://github.com/feross/simple-peer) for voice communication

## 🗂️ Project Structure

```
collabcode/
├── client/                 # Next.js frontend app
│   ├── app/                # App router pages and components
│   ├── components/         # Reusable UI components
│   ├── lib/                # Utilities, stores, and services
│   │   ├── services/       # API and database service functions
│   │   ├── stores/         # Zustand stores for state management
│   │   └── database.types.ts  # Supabase database type definitions
│   ├── sockets/            # Socket.IO client setup
│   └── styles/             # Global styles
├── server/                 # Socket.IO backend server
│   ├── src/                # Server source code
│   └── events/             # Socket event handlers
├── shared/                 # Shared types and constants
├── supabase/               # Database schema and migrations
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites

- [Node.js 18+](https://nodejs.org/)
- npm or yarn
- [Supabase account](https://supabase.io/) (free tier available)
- [HuggingFace API token](https://huggingface.co/settings/tokens) (optional for AI features)

### Installation

#### 1. Clone the repository

```bash
git clone https://github.com/yourusername/collabcode.git
cd collabcode
```

#### 2. Install dependencies

For the client:
```bash
cd client
npm install
```

For the server:
```bash
cd server
npm install
```

#### 3. Set up environment variables

**For the client** (create a `client/.env.local` file):

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Socket.IO Server
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# HuggingFace API (optional)
HF_API_KEY=your_huggingface_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=CollabCode
```

**For the server** (create a `server/.env` file):

```bash
# Server Configuration
PORT=3001
NODE_ENV=development
LOG_LEVEL=info

# Supabase Configuration (for session validation)
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000
```

#### 4. Set up Supabase Database

1. Create a new project in [Supabase](https://app.supabase.io/)
2. Go to the SQL Editor
3. Copy the contents of `supabase/schema-complete.sql`
4. Paste and execute the SQL to set up your database schema

#### 5. Start the development servers

In one terminal, start the client:
```bash
cd client
npm run dev
```

In another terminal, start the server:
```bash
cd server
npm run dev
```

Your app should now be running:
- Client: http://localhost:3000
- Server: http://localhost:3001

## 🛠️ Development

### Client

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npm run type-check
```

### Server

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Clean build files
npm run clean

# Type checking
npm run type-check
```

## 📊 Key Features Implementation

### Real-time Collaboration

CollabCode uses Y.js and Y-WebSocket for conflict-free real-time collaboration. The Monaco Editor is integrated with Y.js to enable multiple users to edit code simultaneously without conflicts.

### Session Management

Users can create coding sessions, generate shareable links, and manage participant access. Sessions are stored in the Supabase PostgreSQL database and can be accessed later.

### Authentication

Supabase Auth provides secure authentication with email/password and OAuth providers. The middleware ensures authenticated access to protected routes.

### Code Snapshots

The platform periodically saves code snapshots to preserve session history and enable version control.

## 🚢 Deployment

### Frontend (Next.js Client)

The Next.js client can be deployed to [Vercel](https://vercel.com/) for optimal performance:

```bash
cd client
vercel
```

### Backend (Socket.IO Server)

The Socket.IO server can be deployed to platforms like [Railway](https://railway.app/) or [Fly.io](https://fly.io/):

```bash
cd server
flyctl launch
```

### Database

Supabase provides managed PostgreSQL hosting with your project.

## 🔌 API Documentation

CollabCode uses a combination of Next.js API routes and direct Supabase client interactions. Below are the key API endpoints and data flows used in the application.

### Next.js API Routes

#### AI Code Explanation

**Endpoint:** `/api/ai/explain`
- **Method:** POST
- **Purpose:** Uses the HuggingFace Inference API to explain code snippets
- **Request Format:**
  ```typescript
  {
    "code": string  // The code to explain
  }
  ```
- **Response Format:**
  ```typescript
  {
    "explanation": string  // AI-generated explanation of the code
  }
  ```
- **Error Responses:**
  - 400: Missing or invalid code
  - 500: AI service configuration error or API failure
- **Example:**
  ```javascript
  // Request
  fetch('/api/ai/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'function add(a, b) { return a + b; }' })
  })

  // Response
  {
    "explanation": "This function takes two parameters 'a' and 'b', and returns their sum."
  }
  ```

#### Authentication Callback

**Endpoint:** `/auth/callback`
- **Method:** GET
- **Purpose:** Handles OAuth callback and session establishment
- **Query Parameters:**
  - `code`: OAuth code from provider
  - `next`: Redirect URL after authentication
  - `joinSession`: Boolean flag for session joining flow
- **Response:** Redirects to target page or error page
- **Example:**
  ```
  GET /auth/callback?code=xyz&next=/session/123&joinSession=true
  ```
  Redirects to `/session/123?forceJoin=true` after successful authentication

### Supabase Client Services

#### Sessions API

These functions interact with the Supabase database through the client SDK:

##### Create Session
- **Function:** `sessionService.createSession(sessionData)`
- **Purpose:** Creates a new coding session
- **Parameters:** 
  ```typescript
  {
    title: string,
    description?: string,
    language: string,
    template_type?: string,
    max_participants?: number,
    is_public?: boolean,
    requires_approval?: boolean,
    created_by: string, // UUID of creator
    starter_code?: string,
    current_code?: string
  }
  ```
- **Returns:** Session object or null on failure

##### Get Session
- **Function:** `sessionService.getSession(sessionId)`
- **Purpose:** Retrieves a single session by ID
- **Parameters:** `sessionId` (UUID string)
- **Returns:** Session object or null if not found

##### Get Session with Participants
- **Function:** `sessionService.getSessionWithParticipants(sessionId)`
- **Purpose:** Retrieves session details with all participants
- **Parameters:** `sessionId` (UUID string)
- **Returns:** Object with session details and participants array

##### Update Session
- **Function:** `sessionService.updateSession(sessionId, updates)`
- **Purpose:** Updates session properties
- **Parameters:** `sessionId` (UUID string) and properties to update
- **Returns:** Updated session object or null

##### Delete Session
- **Function:** `sessionService.deleteSession(sessionId)`
- **Purpose:** Permanently removes a session
- **Parameters:** `sessionId` (UUID string)
- **Returns:** Boolean indicating success

##### Join Session
- **Function:** `sessionService.joinSession(sessionId, userId, role)`
- **Purpose:** Adds a user as participant to a session
- **Parameters:** 
  - `sessionId`: UUID of session
  - `userId`: UUID of user
  - `role`: 'owner' | 'moderator' | 'participant'
- **Returns:** SessionParticipant object or null

##### Leave Session
- **Function:** `sessionService.leaveSession(sessionId, userId)`
- **Purpose:** Marks a user as inactive in a session
- **Parameters:** `sessionId` and `userId`
- **Returns:** Boolean success indicator

##### Save Code Snapshot
- **Function:** `sessionService.saveCodeSnapshot(sessionId, code, options)`
- **Purpose:** Creates version snapshot of code
- **Parameters:**
  ```typescript
  {
    sessionId: string,
    code: string,
    isAutoSave?: boolean,
    language: string,
    savedBy?: string,
    changeSummary?: string
  }
  ```
- **Returns:** CodeSnapshot object or null

#### User API

##### Create User Profile
- **Function:** `userService.createUserProfile(profileData)`
- **Purpose:** Creates new user profile after signup
- **Parameters:**
  ```typescript
  {
    user_id: string,
    display_name: string,
    email?: string,
    avatar_url?: string,
    bio?: string,
    settings?: object
  }
  ```
- **Returns:** UserProfile object or null

##### Get User Profile
- **Function:** `userService.getUserProfile(userId)`
- **Purpose:** Retrieves user profile data
- **Parameters:** `userId` (UUID string)
- **Returns:** UserProfile object or null

##### Update User Profile
- **Function:** `userService.updateUserProfile(userId, updates)`
- **Purpose:** Updates profile fields
- **Parameters:** `userId` and object with fields to update
- **Returns:** Updated UserProfile or null

##### Search Users
- **Function:** `userService.searchUsers(query, limit)`
- **Purpose:** Searches for users by name or email
- **Parameters:** Search string and optional result limit
- **Returns:** Array of matching UserProfile objects

### Socket.IO Communication

The Socket.IO server provides real-time collaboration through these events:

#### Client to Server Events
- `join`: Join a collaboration session
- `leave`: Leave a collaboration session
- `cursor_update`: Broadcast cursor position
- `code_update`: Send code changes to other participants
- `run_code`: Request code execution
- `chat_message`: Send chat message to session

#### Server to Client Events
- `user_joined`: New user joined notification
- `user_left`: User left notification
- `cursor_moved`: Cursor position update
- `code_updated`: Code has been changed
- `execution_result`: Code execution results
- `chat_message`: Incoming chat message
- `error`: Error notification

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Project Maintenance

Before committing to GitHub:

1. Run the cleanup script to remove temporary and debug files:
   ```bash
   # For Windows PowerShell
   .\cleanup.ps1
   
   # For Windows Command Prompt
   cleanup.bat
   ```

2. Make sure all environment variables are properly documented
3. Update the README.md as needed with any new features or changes
4. Run tests to ensure everything is working correctly

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
