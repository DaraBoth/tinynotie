// src/hooks/useGroups.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import API_ROUTES, { apiRequest } from "@/lib/config/apiRoutes";
import { Group, UseGroupsResult, AddGroupVariables, GroupRes } from "@/types/api";

export const useGroups = (initialGroups?: GroupRes): UseGroupsResult => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const fetchGroups = async (): Promise<GroupRes> => {
    if (!session?.user?.id) return {} as GroupRes;
    return await apiRequest({
      url: API_ROUTES.getGroupByUserId(session.user.id),
      method:"GET",
      fetchType: "client",
    });
  };

  // Fetch groups data with initial data as fallback
  const { data: res, isLoading, error } = useQuery<GroupRes>({
    queryKey: ["groups"],
    queryFn: fetchGroups,
    initialData: initialGroups || {} as GroupRes,
  });

  // Add Group Mutation
  const addGroup = useMutation<Group, unknown, AddGroupVariables>({
    mutationFn: async (newGroup: AddGroupVariables) =>
      apiRequest({
        url: "/api/addGroupByUserId",
        method: "POST",
        data: newGroup,
        fetchType: "client",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  return {
    res,
    isLoading,
    error,
    addGroup
  };
};
