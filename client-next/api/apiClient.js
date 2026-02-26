import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Read the token from localStorage (primary) or Zustand in-memory store (fallback).
 * localStorage is always written synchronously by Zustand persist middleware,
 * so it is the most reliable source across module boundaries in production builds.
 */
function getToken() {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('auth-storage');
      if (raw) {
        const token = JSON.parse(raw)?.state?.token;
        if (token) return token;
      }
    } catch { /* ignore */ }
  }
  // Fallback: in-memory store (works in same-module-instance scenarios)
  return useAuthStore.getState().token || null;
}

// Request interceptor — attach token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 without causing redirect loops
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only clear auth + redirect when we're NOT already on the login page.
      // Avoids infinite redirect loops when a stale/unauthenticated request
      // fires before the store is fully hydrated.
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        // Check if we actually have a token — if we do, it's genuinely expired;
        // if we don't, it was a request fired before hydration, so just ignore.
        const token = getToken();
        if (token) {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
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
  createGroup: (data) => apiClient.post('/api/createGroup', data),
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
  addMultipleTrips: (data) => apiClient.post('/api/addMultipleTrips', data),
};
