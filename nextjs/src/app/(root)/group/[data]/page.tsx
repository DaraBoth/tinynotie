import GroupPage from "@/components/pages/GroupPage";
import { apiRequest } from "@/lib/config/apiRoutes";
import { ApiResponse, Member, Trip } from "@/types/api";
import { decodeBase64ToObject } from "@/lib/helper/encode";

export default async function Page({ params }: { params: any }) {
  const data = params?.data;

  if (!data) {
    return <>No group found</>;
  }

  const { groupId, groupName, adminId }: any = decodeBase64ToObject(data);

  // Fetch group members using the correct endpoint
  const membersResponse: ApiResponse<Member[]> = await apiRequest({
    url: `/api/getMemberByGroupId?group_id=${groupId}`,
    method: "GET",
    fetchType: "server",
  });

  // Fetch group trips using the correct endpoint
  const tripsResponse: ApiResponse<Trip[]> = await apiRequest({
    url: `/api/getTripByGroupId?group_id=${groupId}`,
    method: "GET",
    fetchType: "server",
  });

  // Check for errors or invalid responses
  if (!membersResponse.status || !tripsResponse.status) {
    return <>Failed to fetch group data</>;
  }

  // Pass fetched data as props to the client-side GroupPage component
  return (
    <>
      <GroupPage
        groupId={groupId}
        initialMembers={membersResponse}
        initialTrips={tripsResponse}
      />
    </>
  );
}
