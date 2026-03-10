import './globals.css';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import { Providers } from './providers';
import { TokenExpirationHandler } from '@/components/TokenExpirationHandler';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'Tiny Notie – Smart Expense Tracker',
  description: 'Note your expense with your friend. Track group expenses with AI-powered insights.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Tiny Notie',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    siteName: 'Tiny Notie',
    title: 'Tiny Notie – Smart Expense Tracker',
    description: 'Note your expense with your friend.',
  },
  icons: {
    icon: [
      { url: '/icons/maskable_icon_x48.png',  sizes: '48x48',  type: 'image/png' },
      { url: '/icons/maskable_icon_x96.png',  sizes: '96x96',  type: 'image/png' },
      { url: '/icons/maskable_icon_x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/maskable_icon_x72.png',  sizes: '72x72'  },
      { url: '/icons/maskable_icon_x96.png',  sizes: '96x96'  },
      { url: '/icons/maskable_icon_x128.png', sizes: '128x128' },
      { url: '/icons/maskable_icon_x192.png', sizes: '192x192' },
      { url: '/icons/maskable_icon_x384.png', sizes: '384x384' },
      { url: '/icons/maskable_icon_x512.png', sizes: '512x512' },
    ],
    shortcut: '/icons/maskable_icon_x192.png',
  },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1C355A' },
    { media: '(prefers-color-scheme: dark)',  color: '#121826' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Fallback for older browsers that don't read metadata icons */}
        <link rel="icon"             href="/icons/maskable_icon_x48.png" sizes="48x48" />
        <link rel="icon"             href="/icons/maskable_icon_x96.png" sizes="96x96" />
        <link rel="icon"             href="/icons/maskable_icon_x192.png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icons/maskable_icon_x192.png" />
        <link rel="apple-touch-icon" sizes="72x72"   href="/icons/maskable_icon_x72.png" />
        <link rel="apple-touch-icon" sizes="96x96"   href="/icons/maskable_icon_x96.png" />
        <link rel="apple-touch-icon" sizes="128x128" href="/icons/maskable_icon_x128.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/maskable_icon_x192.png" />
        <link rel="apple-touch-icon" sizes="384x384" href="/icons/maskable_icon_x384.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/maskable_icon_x512.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Tiny Notie" />
      </head>
      <body className={inter.variable} suppressHydrationWarning>
        <Suspense fallback={null}>
          <Providers>
            <ServiceWorkerRegistration />
            <TokenExpirationHandler />
            {children}
          </Providers>
        </Suspense>
      </body>
    </html>
  );
}
