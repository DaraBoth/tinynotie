# 🚀 Migration Guide: React + Vite → Next.js 16.1.6

## Overview

This guide helps you migrate from the existing React + Vite setup to the new Next.js 16.1.6 architecture.

## Key Changes

### 1. Routing
**Before (React Router):**
```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/home" element={<HomePage />} />
</Routes>
```

**After (Next.js App Router):**
- File-based routing in `app/` directory
- `app/login/page.jsx` → `/login`
- `app/home/page.jsx` → `/home`
- No Router needed!

### 2. State Management
**Before (Redux Toolkit):**
```jsx
import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null },
  reducers: {
    setAuth: (state, action) => {
      state.user = action.payload;
    }
  }
});
```

**After (Zustand):**
```jsx
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  setAuth: (user) => set({ user }),
}));
```

### 3. Server State
**Before (RTK Query):**
```jsx
const { data } = useGetGroupsQuery(userId);
```

**After (TanStack Query):**
```jsx
const { data } = useQuery({
  queryKey: ['groups', userId],
  queryFn: () => api.getGroups(userId),
});
```

### 4. Styling
**Before (Material-UI + SCSS):**
```jsx
import { Button } from '@mui/material';
import './styles.scss';

<Button variant="contained">Click</Button>
```

**After (shadcn/ui + Tailwind):**
```jsx
import { Button } from '@/components/ui/button';

<Button>Click</Button>
```

### 5. Client vs Server Components
**New in Next.js:**
- Components are Server Components by default
- Add `'use client'` directive for client-side features:
  - State (useState, useReducer)
  - Effects (useEffect)
  - Event handlers
  - Browser APIs
  - Zustand stores

```jsx
'use client';

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

## Component Migration Examples

### GroupPage.jsx

**Before:**
```jsx
import { useSelector } from 'react-redux';
import { useGetGroupQuery } from '@/api/apiSlice';
import { Button } from '@mui/material';

export function GroupPage() {
  const user = useSelector((state) => state.auth.user);
  const { data: group } = useGetGroupQuery(groupId);
  
  return (
    <Box>
      <Button variant="contained">Add Trip</Button>
    </Box>
  );
}
```

**After:**
```jsx
'use client';

import { useAuthStore } from '@/store/authStore';
import { useGroup } from '@/hooks/useQueries';
import { Button } from '@/components/ui/button';

export default function GroupPage({ params }) {
  const user = useAuthStore((state) => state.user);
  const { data: group } = useGroup(params.groupId);
  
  return (
    <div>
      <Button>Add Trip</Button>
    </div>
  );
}
```

## Step-by-Step Migration

### Phase 1: Setup (Day 1)
1. ✅ Create client-next folder
2. ✅ Install dependencies
3. ✅ Configure Next.js, Tailwind, shadcn
4. ✅ Setup Zustand stores
5. ✅ Configure TanStack Query

### Phase 2: Core Pages (Days 2-3)
1. Migrate Login page
2. Migrate Register page
3. Migrate Home page
4. Test authentication flow

### Phase 3: Complex Features (Days 4-6)
1. Migrate GroupPage with all dialogs
2. Migrate EditTrip, EditMember components
3. Migrate ChatWithDatabase
4. Test all CRUD operations

### Phase 4: Polish (Days 7-8)
1. Add animations with Framer Motion
2. Implement responsive design
3. Add loading states
4. Test on mobile devices

### Phase 5: Testing & Deployment (Days 9-10)
1. Test all features
2. Fix bugs
3. Deploy to Vercel
4. Monitor performance

## Installing Additional shadcn Components

```bash
# Forms
npx shadcn@latest add form
npx shadcn@latest add label
npx shadcn@latest add select
npx shadcn@latest add textarea

# Data Display
npx shadcn@latest add table
npx shadcn@latest add badge
npx shadcn@latest add avatar
npx shadcn@latest add separator

# Overlays
npx shadcn@latest add sheet
npx shadcn@latest add popover
npx shadcn@latest add tooltip
npx shadcn@latest add alert-dialog

# Feedback
npx shadcn@latest add progress
npx shadcn@latest add skeleton
npx shadcn@latest add toast
```

## Common Patterns

### Protected Routes
```jsx
// app/groups/[groupId]/page.jsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function GroupPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // ... rest of component
}
```

### Dynamic Imports
```jsx
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <Loading />,
  ssr: false, // Client-side only
});
```

### API Routes (if needed)
```jsx
// app/api/hello/route.js
export async function GET(request) {
  return Response.json({ message: 'Hello' });
}
```

## Performance Optimizations

### 1. Use Server Components
Keep components as Server Components when possible (no 'use client').

### 2. Optimize Images
```jsx
import Image from 'next/image';

<Image
  src="/photo.jpg"
  width={500}
  height={300}
  alt="Photo"
  priority // For LCP images
/>
```

### 3. Prefetch Links
```jsx
import Link from 'next/link';

<Link href="/groups" prefetch={true}>
  Groups
</Link>
```

### 4. Use Suspense
```jsx
import { Suspense } from 'react';

<Suspense fallback={<Loading />}>
  <GroupList />
</Suspense>
```

## Testing

```bash
# Run dev server
npm run dev

# Test production build
npm run build
npm start
```

## Deployment

```bash
# Deploy to Vercel
vercel

# Environment variables
# Set in Vercel dashboard:
# - NEXT_PUBLIC_API_URL
# - NEXT_PUBLIC_GEMINI_API_KEY (if needed)
```

## Troubleshooting

### "use client" errors
- Add 'use client' to components using hooks or event handlers

### Hydration errors
- Ensure server and client render the same content
- Use `suppressHydrationWarning` on elements with dynamic content

### Module not found
- Check import paths use @ alias correctly
- Verify jsconfig.json paths are correct

### API errors
- Check NEXT_PUBLIC_API_URL is set
- Verify API is running on correct port

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Zustand Guide](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [TanStack Query](https://tanstack.com/query/latest)
- [shadcn/ui](https://ui.shadcn.com)

## Need Help?

Refer to the existing client-next code for working examples of:
- Authentication flow
- TanStack Query usage
- Zustand stores
- shadcn component usage
- Responsive design patterns
