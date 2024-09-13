import { useQuery } from "@tanstack/react-query";
import API_ROUTES, { apiRequest } from "@/lib/config/apiRoutes";
import { Member, Trip, UseGroupDataResult, ApiResponse } from "@/types/api";

interface UseGroupDataParams {
  groupId: number;
  initialMembers?: ApiResponse<Member[]>;
  initialTrips?: ApiResponse<Trip[]>;
}

export const useGroupData = ({
  groupId,
  initialMembers = { status: true, data: [] },
  initialTrips = { status: true, data: [] },
}: UseGroupDataParams): UseGroupDataResult => {
  // Fetch members for a specific group
  const fetchGroupMembers = async (): Promise<ApiResponse<Member[]>> => {
    return await apiRequest({
      url: API_ROUTES.getGroupMembers(groupId),
      method: "GET",
      fetchType: "client",
    });
  };

  // Fetch trips for a specific group
  const fetchGroupTrips = async (): Promise<ApiResponse<Trip[]>> => {
    return await apiRequest({
      url: API_ROUTES.getGroupTrips(groupId),
      method: "GET",
      fetchType: "client",
    });
  };

  // Query to fetch group members with initial data
  const {
    data: membersResponse,
    isLoading: isLoadingMembers,
    error: membersError,
  } = useQuery<ApiResponse<Member[]>>({
    queryKey: ["groupMembers", groupId],
    queryFn: fetchGroupMembers,
    initialData: initialMembers,
  });

  // Query to fetch group trips with initial data
  const {
    data: tripsResponse,
    isLoading: isLoadingTrips,
    error: tripsError,
  } = useQuery<ApiResponse<Trip[]>>({
    queryKey: ["groupTrips", groupId],
    queryFn: fetchGroupTrips,
    initialData: initialTrips,
  });

  return {
    members: membersResponse,
    trips: tripsResponse,
    isLoading: isLoadingMembers || isLoadingTrips,
    error: membersError || tripsError,
  };
};
