# CollabCode - Real-time Collaborative Coding Platform

A modern, real-time collaborative coding platform built with Next.js, Socket.IO, Monaco Editor, Y.js, and Supabase.

## 🚀 Features

- **Real-time Collaboration**: Multiple users can edit code simultaneously
- **Monaco Editor**: VSCode-like editing experience with syntax highlighting
- **Y.js Integration**: Conflict-free collaborative editing with operational transforms
- **Socket.IO**: WebSocket-based real-time communication
- **User Authentication**: Secure login with Supabase Auth
- **Session Management**: Create and join coding sessions
- **Code Snapshots**: Version control with auto-save functionality
- **Multi-language Support**: JavaScript, TypeScript, Python, Java, C++, and more
- **Auto-save**: Periodic code snapshots

## Tech Stack

- **Frontend**: Next.js, Tailwind CSS, Monaco Editor, Zustand
- **Backend**: Socket.IO server + Next.js API routes
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth (Email + GitHub)
- **AI**: HuggingFace Inference API
- **Real-time**: Socket.IO
- **Voice**: WebRTC + Simple-Peer

## Project Structure

```
collabcode/
├── client/                 # Next.js frontend app
├── server/                # Socket.IO backend server
├── shared/                # Shared types and constants
├── supabase/              # Database schema and migrations
└── README.md              # This file
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- HuggingFace API token

### Installation

1. Clone the repository
2. Install dependencies for both client and server
3. Set up environment variables
4. Run the development servers

See individual README files in `client/` and `server/` directories for detailed setup instructions.

## Development

- **Frontend**: `cd client && npm run dev`
- **Backend**: `cd server && npm run dev`

## Deployment

- **Frontend**: Deploy to Vercel
- **Backend**: Deploy to Railway/Fly.io
- **Database**: Hosted on Supabase

## License

MIT License
