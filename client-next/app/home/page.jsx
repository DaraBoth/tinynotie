import { redirect } from 'next/navigation';

import { HomePageClient } from './HomePageClient';
import { getServerAuthContext, serverApiGet } from '@/lib/serverApi';

export default async function HomePage() {
  const { token, userId } = await getServerAuthContext();

  if (!token || !userId) {
    redirect('/login');
  }

  let initialUser = null;
  let initialGroups = null;

  try {
    const [profileResponse, groupsResponse] = await Promise.all([
      serverApiGet('/api/getUserProfile', { token }),
      serverApiGet('/api/getGroupListWithDetails', {
        token,
        params: { user_id: userId },
      }),
    ]);

    initialUser = profileResponse?.data || null;
    initialGroups = groupsResponse?.data || [];
  } catch {
    // Fall back to client-side query path if server prefetch fails.
  }

  return <HomePageClient initialUser={initialUser} initialGroups={initialGroups} />;
}