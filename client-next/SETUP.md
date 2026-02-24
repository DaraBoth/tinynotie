# 📋 Setup Instructions

## Quick Start

```bash
# 1. Navigate to client-next directory
cd client-next

# 2. Run clean install
node clean-install.cjs

# 3. Setup environment
cp .env.example .env

# 4. Edit .env and set your API URL
# NEXT_PUBLIC_API_URL=http://localhost:9000

# 5. Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Manual Setup

If you prefer manual installation:

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your settings
```

## Environment Variables

Create a `.env` file with:

```bash
NEXT_PUBLIC_API_URL=http://localhost:9000
NEXT_PUBLIC_GEMINI_API_KEY=your_key_here
NEXT_PUBLIC_APP_NAME=TinyNotie
NEXT_PUBLIC_APP_VERSION=2.0.0
NODE_ENV=development
```

## Installing shadcn Components

As you need more UI components:

```bash
# Install a component
npx shadcn@latest add [component-name]

# Examples:
npx shadcn@latest add table
npx shadcn@latest add form
npx shadcn@latest add select
npx shadcn@latest add badge
npx shadcn@latest add avatar
npx shadcn@latest add sheet
npx shadcn@latest add popover
npx shadcn@latest add tooltip
npx shadcn@latest add skeleton
```

## Installing Magic UI Components

Visit [Magic UI](https://magicui.design/) and copy components you need into `components/magicui/`

Popular components:
- Animated grid background
- Shimmer button
- Marquee
- Bento grid
- Particle effects

## Development Scripts

```bash
# Start dev server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Project Structure

```
client-next/
├── app/                    # Next.js App Router
│   ├── layout.jsx         # Root layout
│   ├── page.jsx           # Landing page
│   ├── providers.jsx      # Global providers
│   ├── globals.css        # Global styles
│   ├── login/             # Login page
│   │   └── page.jsx
│   └── home/              # Dashboard
│       └── page.jsx
├── components/            # React components
│   ├── ui/               # shadcn components
│   ├── magicui/          # Magic UI components (add as needed)
│   ├── SpaceSky.jsx      # Animated background
│   ├── Loading.jsx       # Loading component
│   └── ThemeSwitcher.jsx # Theme toggle
├── store/                # Zustand stores
│   ├── authStore.js      # Auth state
│   ├── themeStore.js     # Theme state
│   └── uiStore.js        # UI state
├── api/                  # API client
│   └── apiClient.js      # Axios instance
├── hooks/                # Custom hooks
│   ├── useQueries.js     # TanStack Query hooks
│   └── useWindowDimensions.js
├── utils/                # Helper functions
│   ├── helpers.js        # General utilities
│   └── time.js           # Time formatting
├── lib/                  # Library utilities
│   └── utils.js          # Tailwind utilities
├── assets/               # Lottie animations
└── public/               # Static files
    ├── icons/            # PWA icons
    └── manifest.json     # PWA manifest
```

## Adding Lottie Animations

1. Copy your Lottie JSON files from old client to `assets/` folder
2. Import and use:

```jsx
import Lottie from 'lottie-react';
import animationData from '@/assets/animation.json';

<Lottie animationData={animationData} loop />
```

## Setting Up Icons

Copy icon files from `client/public/icons/` to `client-next/public/icons/`

## Tips

### 1. Server vs Client Components
- Use Server Components by default (faster, better SEO)
- Add `'use client'` only when you need:
  - useState, useEffect
  - Event handlers (onClick, onChange)
  - Browser APIs (window, localStorage)
  - Zustand stores

### 2. Imports
Use the @ alias for clean imports:
```jsx
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/api/apiClient';
```

### 3. Styling
Use Tailwind classes:
```jsx
<div className="flex items-center gap-4 p-6 rounded-lg bg-card">
  <Button className="w-full">Submit</Button>
</div>
```

### 4. Responsive Design
Use Tailwind breakpoints:
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Mobile: 1 col, Tablet: 2 cols, Desktop: 3 cols */}
</div>
```

### 5. Dark Mode
Theme switcher is already set up. Use:
```jsx
<div className="bg-white dark:bg-slate-900">
  <p className="text-black dark:text-white">Text</p>
</div>
```

## Troubleshooting

### Port already in use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

### Module not found
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json .next
npm install
```

### Build errors
```bash
# Check for errors
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

## Next Steps

1. ✅ Install dependencies
2. ✅ Configure environment variables
3. Start development server
4. Begin migrating components from old client
5. Refer to MIGRATION.md for detailed guide

## Getting Help

- Check [Next.js Documentation](https://nextjs.org/docs)
- Read [MIGRATION.md](./MIGRATION.md) for migration guide
- Review existing components in `components/` for examples
- Check [shadcn/ui docs](https://ui.shadcn.com) for component usage

Happy coding! 🚀
