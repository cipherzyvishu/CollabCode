import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'CollabCode - Collaborative Coding Platform',
  description: 'Real-time collaborative coding with AI assistance',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="bg-gray-50 text-gray-900 antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
