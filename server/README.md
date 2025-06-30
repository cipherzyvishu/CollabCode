# CollabCode Server

Socket.IO backend server for real-time collaboration.

## Features

- Real-time code synchronization
- User presence tracking
- Session management
- WebSocket communication

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Start development server:
```bash
npm run dev
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server

## Environment Variables

- `PORT` - Server port (default: 3001)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
