import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { toast } from 'sonner';

// ==================== Groups ====================

export function useGroups(userId) {
  return useQuery({
    queryKey: ['groups', userId],
    queryFn: async () => {
      const response = await api.getGroupsByUserId(userId);
      return response.data.data; // Extract the actual data array
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useGroup(groupId) {
  return useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      // Fetch group details, members, and trips in parallel
      const [groupResponse, membersResponse, tripsResponse] = await Promise.all([
        api.getGroupById(groupId),
        api.getMembersByGroupId(groupId),
        api.getTripsByGroupId(groupId),
      ]);
      
      return {
        group: groupResponse.data.data,
        members: membersResponse.data.data || [],
        trips: tripsResponse.data.data || [],
      };
    },
    enabled: !!groupId,
    staleTime: 60 * 1000,
  });
}

export function useAddGroup(userId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupData) => api.addGroup({ ...groupData, user_id: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', userId] });
      toast.success('Group created successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create group';
      toast.error(message);
    },
  });
}

export function useUpdateGroupVisibility(groupId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.updateGroupVisibility({ ...data, group_id: groupId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Group visibility updated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update group visibility';
      toast.error(message);
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId) => api.deleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Group deleted successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete group';
      toast.error(message);
    },
  });
}

// ==================== Members ====================

export function useAddMember(groupId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberData) => api.addMember({ ...memberData, group_id: groupId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      toast.success('Member added successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to add member';
      toast.error(message);
    },
  });
}

export function useUpdateMember(groupId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.updateMember(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      toast.success('Member updated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update member';
      toast.error(message);
    },
  });
}

export function useDeleteMember(groupId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId) => api.deleteMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      toast.success('Member deleted successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete member';
      toast.error(message);
    },
  });
}

// ==================== Trips ====================

export function useAddTrip(groupId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tripData) => api.addTrip({ ...tripData, group_id: groupId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      toast.success('Trip added successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to add trip';
      toast.error(message);
    },
  });
}

export function useUpdateTrip(groupId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.updateTrip(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      toast.success('Trip updated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update trip';
      toast.error(message);
    },
  });
}

export function useDeleteTrip(groupId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tripId) => api.deleteTrip(tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      toast.success('Trip deleted successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete trip';
      toast.error(message);
    },
  });
}

// ==================== User ====================

export function useUserInfo(userId) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await api.getUserInfo(userId);
      return response.data.data; // Extract the actual data object
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateUserInfo(userId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.updateUserInfo({ ...data, user_id: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
    },
  });
}

// ==================== AI & Chat ====================

export function useSendMessage() {
  return useMutation({
    mutationFn: (data) => api.askDatabase(data),
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to send message';
      toast.error(message);
    },
  });
}
