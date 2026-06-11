import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AppProvider } from '@/lib/context/AppContext'

export const metadata: Metadata = {
  title: {
    default: 'Dhwani - AI Visibility Audit & Recommendation Intelligence',
    template: '%s | Dhwani',
  },
  description:
    'See how often ChatGPT, Claude, Gemini and Perplexity recommend your business compared to competitors. Get AI visibility audits and competitive insights.',
  keywords: [
    'AI visibility',
    'SEO audit',
    'ChatGPT recommendations',
    'AI search',
    'conversational AI',
    'competitor analysis',
    'AI recommendation engine',
  ],
  authors: [{ name: 'Dhwani' }],
  creator: 'Dhwani',
  publisher: 'Dhwani',
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://dhwani.ai',
    title: 'Dhwani - AI Visibility Audit & Recommendation Intelligence',
    description:
      'Monitor how AI language models recommend your business across ChatGPT, Claude, Gemini, and Perplexity.',
    siteName: 'Dhwani',
    images: [
      {
        url: 'https://dhwani.ai/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Dhwani AI Visibility Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dhwani - AI Visibility Audit',
    description: 'Monitor AI recommendations for your business',
    images: ['https://dhwani.ai/og-image.png'],
  },
  icons: {
    icon: [
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/icon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
    ],
    apple: '/apple-icon.png',
  },
  manifest: '/site.webmanifest',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: true,
  themeColor: '#060B0D',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-brand-bg">
      <head>
        <meta name="theme-color" content="#060B0D" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="font-sans antialiased text-brand-text bg-brand-bg">
        <AppProvider>{children}</AppProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
