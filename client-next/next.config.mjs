/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable Turbopack for faster builds (stable in Next.js 16)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Enable Partial Prerendering for instant navigation
  cacheComponents: true,

  // Compiler options
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000',
  },

  // PWA configuration
  headers: async () => [
    {
      source: '/manifest.json',
      headers: [
        {
          key: 'Content-Type',
          value: 'application/manifest+json',
        },
      ],
    },
  ],

  // Disable x-powered-by header
  poweredByHeader: false,

  // Strict mode for better development experience
  reactStrictMode: true,
};

export default nextConfig;
