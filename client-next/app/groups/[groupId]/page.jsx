import { Suspense, use } from 'react';
import { Loading } from '@/components/Loading';
import { GroupPageClient } from './GroupPageClient';

function GroupPageWrapper({ params }) {
  const { groupId } = use(params);
  return <GroupPageClient groupId={groupId} />;
}

export default function GroupPage({ params }) {
  return (
    <Suspense fallback={<Loading text="Loading group..." />}>
      <GroupPageWrapper params={params} />
    </Suspense>
  );
}
