import { redirect } from 'next/navigation';

import { GroupPageClient } from './GroupPageClient';
import { getServerAuthContext, serverApiGet } from '@/lib/serverApi';

export const dynamic = 'force-dynamic';

export default async function GroupPage({ params }) {
  const { token } = await getServerAuthContext();
  const { groupId } = await params;

  if (!token) {
    redirect('/login');
  }

  let initialData = null;
  try {
    const [groupResponse, membersResponse, tripsResponse] = await Promise.all([
      serverApiGet('/api/getGroupDetail', { token, params: { group_id: groupId } }),
      serverApiGet('/api/getMemberByGroupId', { token, params: { group_id: groupId } }),
      serverApiGet('/api/getTripByGroupId', { token, params: { group_id: groupId } }),
    ]);

    initialData = {
      group: groupResponse?.data || {},
      members: membersResponse?.data || [],
      trips: tripsResponse?.data || [],
    };
  } catch {
    // Fall back to client-side query path if server prefetch fails.
  }

  return <GroupPageClient groupId={groupId} initialData={initialData} />;
}
