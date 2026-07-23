import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Mono, IBM_Plex_Sans, Syne } from 'next/font/google'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-syne',
})

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-sans',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
})

export const metadata: Metadata = {
  title: {
    default: 'Orion — Multi-Agent Orchestration Console',
    template: '%s | Orion',
  },
  description:
    'Orion plans objectives across specialized LLM agents, streams execution in real time, and turns model output into a validated project workspace you can preview and export.',
  keywords: [
    'multi-agent',
    'LLM orchestration',
    'code generation',
    'OpenRouter',
    'artifact engine',
    'SSE',
  ],
  authors: [{ name: 'Orion' }],
  openGraph: {
    type: 'website',
    title: 'Orion — Multi-Agent Orchestration Console',
    description:
      'Plan, execute, and export projects with specialized agents over open-source models.',
    siteName: 'Orion',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Orion — Multi-Agent Orchestration Console',
    description:
      'Plan, execute, and export projects with specialized agents over open-source models.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#12141a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${syne.variable} ${plexSans.variable} ${plexMono.variable} dark`}>
      <body className="antialiased font-sans bg-background text-foreground">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
