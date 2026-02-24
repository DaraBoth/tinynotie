import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { TokenExpirationHandler } from '@/components/TokenExpirationHandler';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'TinyNotie - Smart Expense Tracker',
  description: 'Track group expenses with AI-powered insights',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TinyNotie',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'TinyNotie',
    title: 'TinyNotie - Smart Expense Tracker',
    description: 'Track group expenses with AI-powered insights',
  },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={inter.variable}>
        <Providers>
          <TokenExpirationHandler />
          {children}
        </Providers>
      </body>
    </html>
  );
}
