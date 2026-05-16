import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SITE, META, SOCIAL } from '@/lib/constants/site'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.title,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  keywords: META.keywords,
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  publisher: SITE.name,
  alternates: { canonical: '/' },
  robots: META.robots,
  openGraph: {
    type: 'website',
    locale: SITE.locale,
    url: SITE.url,
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    images: [{ url: META.ogImage, width: 1200, height: 630, alt: `${SITE.name} — Monitoreo de Contrataciones Públicas en Guatemala` }],
  },
  twitter: {
    card: 'summary_large_image',
    site: SOCIAL.twitterHandle,
    creator: SOCIAL.twitterHandle,
    title: SITE.title,
    description: SITE.description,
    images: [META.ogImage],
  },
  icons: {
    icon: [
      { url: META.favicon, sizes: 'any' },
      { url: META.icons.icon192, sizes: '192x192', type: 'image/png' },
      { url: META.icons.icon512, sizes: '512x512', type: 'image/png' },
    ],
    shortcut: META.favicon,
    apple: { url: META.appleTouchIcon, sizes: '180x180' },
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${inter.variable} bg-background`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased min-h-screen">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
