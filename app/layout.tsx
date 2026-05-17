import { Suspense } from 'react'
import type { Metadata, Viewport } from 'next'
import { Roboto } from 'next/font/google'
import { SiteHeader } from '@/components/site-header'
import { ServiceWorkerRegister } from '@/components/service-worker-register'
import './globals.css'

const roboto = Roboto({
  subsets: ['latin'],
  variable: '--font-roboto',
  weight: ['400', '500', '700', '900'],
  style: ['normal', 'italic'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Overwatch dashboard',
  description: 'A hero-first Overwatch 2 stats dashboard.',
  manifest: '/manifest.webmanifest',
  applicationName: 'Overwatch',
  appleWebApp: {
    capable: true,
    title: 'Overwatch',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#07070a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={roboto.variable}>
      <body>
        <Suspense fallback={<div className="h-14 md:h-16 border-b border-border-default" />}>
          <SiteHeader />
        </Suspense>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
