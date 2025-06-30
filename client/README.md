# CollabCode Client

Next.js frontend application for the collaborative coding platform.

## Features

- Monaco Editor integration
- Real-time collaboration
- Supabase authentication
- AI-powered code assistance
- Voice chat capabilities
- Responsive design with Tailwind CSS

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
HF_API_KEY=your_huggingface_api_key
```

3. Start development server:
```bash
npm run dev
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_SOCKET_URL` - Socket.IO server URL
- `HF_API_KEY` - HuggingFace API key (server-side only)
