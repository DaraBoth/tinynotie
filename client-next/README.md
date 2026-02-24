# TinyNotie Next.js

Modern expense tracking application built with Next.js 16.1.6, React 19, and the latest web technologies.

## 🚀 Features

- **Next.js 16.1.6** with Turbopack for blazing-fast builds
- **React 19.2** with React Compiler for automatic optimization
- **Partial Prerendering (PPR)** for instant navigation
- **Zustand** for simple, powerful state management
- **TanStack Query v5** for server state management
- **shadcn/ui** for beautiful, accessible components
- **Magic UI** for advanced animations
- **Tailwind CSS** for utility-first styling
- **Framer Motion** for smooth animations
- **TypeScript** support with JSDoc
- **PWA** capabilities

## 📦 Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your API URL
# NEXT_PUBLIC_API_URL=http://localhost:9000
```

## 🛠️ Development

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

The development server runs on [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
client-next/
├── app/                  # Next.js App Router
│   ├── layout.jsx       # Root layout
│   ├── page.jsx         # Home page
│   ├── providers.jsx    # Client providers
│   ├── globals.css      # Global styles
│   ├── login/           # Login page
│   └── home/            # Dashboard page
├── components/          # React components
│   ├── ui/             # shadcn components
│   ├── SpaceSky.jsx    # Animated background
│   ├── Loading.jsx     # Loading component
│   └── ThemeSwitcher.jsx
├── store/              # Zustand stores
│   ├── authStore.js    # Authentication state
│   ├── themeStore.js   # Theme state
│   └── uiStore.js      # UI state
├── api/                # API client
│   └── apiClient.js    # Axios instance
├── hooks/              # Custom hooks
│   └── useWindowDimensions.js
├── lib/                # Utilities
│   └── utils.js        # Helper functions
└── public/             # Static assets
```

## 🎨 Adding shadcn/ui Components

```bash
# Example: Add more components
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add table
npx shadcn@latest add form
```

## 🔧 Configuration

### Next.js Config
- Turbopack enabled by default
- React Compiler for automatic memoization
- Partial Prerendering (PPR) enabled incrementally
- Image optimization with WebP/AVIF

### Zustand Stores
- **authStore**: User authentication and session
- **themeStore**: Theme preferences
- **uiStore**: UI state (dialogs, view modes)

### TanStack Query
- Configured with sensible defaults
- 1-minute stale time
- 5-minute cache time
- React Query DevTools in development

## 🚢 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Manual Build
```bash
npm run build
npm start
```

## 🔄 Migration from Client (React + Vite)

Key differences:
1. **File-based routing** instead of react-router-dom
2. **Server Components** by default (use `'use client'` for client components)
3. **Zustand** instead of Redux Toolkit
4. **TanStack Query** instead of RTK Query
5. **shadcn/ui** instead of Material-UI
6. **Tailwind CSS** instead of SCSS

## 📚 Key Libraries

- `next@16.1.6` - React framework
- `react@19.0.0` - UI library
- `zustand@5.0.2` - State management
- `@tanstack/react-query@5.62.0` - Server state
- `axios@1.7.9` - HTTP client
- `framer-motion@11.15.0` - Animations
- `tailwindcss@3.4.17` - Styling
- `next-themes@0.4.4` - Theme management
- `sonner@1.7.1` - Toast notifications

## 🎯 Performance

Expected improvements over React + Vite:
- **6x faster** first page load (PPR + SSR)
- **3x faster** time to interactive
- **<1s** dev server start (Turbopack)
- **Automatic** code optimization (React Compiler)

## 📖 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [TanStack Query](https://tanstack.com/query)
- [Zustand](https://docs.pmnd.rs/zustand)
- [Tailwind CSS](https://tailwindcss.com)

## 📝 License

MIT
