import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from sessionStorage (matching current behavior)
    const authData = sessionStorage.getItem('auth-storage');
    if (authData) {
      try {
        const { state } = JSON.parse(authData);
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      } catch (error) {
        console.error('Error parsing auth data:', error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      sessionStorage.removeItem('auth-storage');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// API endpoint functions
export const api = {
  // Auth
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),

  // User
  getUserInfo: (userId) => apiClient.get('/api/getUserProfile', { params: { user_id: userId } }),
  updateUserInfo: (data) => apiClient.put('/api/updateUserInfo', data),
  uploadImage: (formData) =>
    apiClient.post('/api/uploadImage', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  searchUsers: (searchWords, filterBy = 'ALL') => 
    apiClient.get('/api/userSearch', { params: { searchWords, filterBy } }),

  // Groups
  getGroupsByUserId: (userId) => apiClient.get('/api/getGroupByUserId', { params: { user_id: userId } }),
  getGroupsWithDetails: (userId) => apiClient.get('/api/getGroupListWithDetails', { params: { user_id: userId } }),
  addGroup: (data) => apiClient.post('/api/addGroupByUserId', data),
  getGroupById: (groupId, userId) => apiClient.get('/api/getGroupDetail', { params: { group_id: groupId, user_id: userId } }),
  updateGroupVisibility: (data) => apiClient.post('/api/updateGroupVisibility', data),
  deleteGroup: (groupId) => apiClient.delete('/api/deleteGroupById', { params: { group_id: groupId } }),

  // Members
  getAllMembers: () => apiClient.get('/api/getAllMember'),
  addMember: (data) => apiClient.post('/api/addMemberByGroupId', data),
  updateMember: (data) => apiClient.post('/api/editMemberByMemberId', data),
  deleteMember: (memberId) => apiClient.delete(`/api/members/${memberId}`),
  getMembersByGroupId: (groupId) => apiClient.get('/api/getMemberByGroupId', { params: { group_id: groupId } }),

  // Trips
  addTrip: (data) => apiClient.post('/api/addTripByGroupId', data),
  updateTrip: (data) => apiClient.post('/api/editTripByGroupId', data),
  deleteTrip: (tripId, groupId) => apiClient.delete('/api/deleteTripById', { data: { trip_id: tripId, group_id: groupId } }),
  getTripsByGroupId: (groupId) => apiClient.get('/api/getTripByGroupId', { params: { group_id: groupId } }),

  // AI & Utilities
  askDatabase: (data) => apiClient.post('/api/askDatabase', data),
  translateText: (data) => apiClient.post('/api/translate', data),
  receiptImage: (formData) => apiClient.post('/api/receiptImage', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};
