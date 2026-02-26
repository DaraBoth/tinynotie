import { Suspense } from 'react';
import { Loading } from '@/components/Loading';
import { GroupPageClient } from './GroupPageClient';

export default async function GroupPage({ params }) {
  const { groupId } = await params;
  return (
    <Suspense fallback={<Loading text="Loading group..." />}>
      <GroupPageClient groupId={groupId} />
    </Suspense>
  );
}
