import { GroupPageClient } from './GroupPageClient';

export default async function GroupPage({ params }) {
  const { groupId } = await params;
  return <GroupPageClient groupId={groupId} />;
}
