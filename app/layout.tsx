import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'ORION AI — Multi-Agent Development OS',
    template: '%s | ORION AI',
  },
  description:
    'ORION AI is a multi-agent AI operating system that plans, engineers, researches, and markets your projects — powered by the world\'s best open-source models via OpenRouter.',
  keywords: ['AI', 'agents', 'code generation', 'engineering', 'AI OS', 'OpenRouter', 'LLM'],
  authors: [{ name: 'ORION AI' }],
  openGraph: {
    type: 'website',
    title: 'ORION AI — Multi-Agent Development OS',
    description: 'AI agents that plan, build, research, and market your next project.',
    siteName: 'ORION AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ORION AI — Multi-Agent Development OS',
    description: 'AI agents that plan, build, research, and market your next project.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#0d1117' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased font-sans">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
