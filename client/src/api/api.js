import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Function to get the JWT token from sessionStorage
const getToken = () => sessionStorage.getItem("token");

// Create a custom base query with error handling
const baseQueryWithErrorHandling = async (args, api, extraOptions) => {
  const baseQuery = fetchBaseQuery({
    baseUrl: import.meta.env.VITE_BASE_URL,
    prepareHeaders: (headers) => {
      // Get the token from sessionStorage
      const token = getToken();

      // If we have a token, set the Authorization header
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return headers;
    },
  });

  // Execute the query
  const result = await baseQuery(args, api, extraOptions);

  // Check if we got an error response
  if (result.error) {
    // Check for token expiration (401 Unauthorized)
    if (result.error.status === 401) {
      // Clear the token
      sessionStorage.removeItem("token");

      // Dispatch a custom action to notify the app about token expiration
      api.dispatch({ type: 'auth/tokenExpired' });

      // Return a modified error with a custom message
      return {
        error: {
          ...result.error,
          message: "Your session has expired. Please log in again."
        }
      };
    }
  }

  return result;
};

export const api = createApi({
  baseQuery: baseQueryWithErrorHandling,
  reducerPath: "main",
  tagTypes: [],
  endpoints: (build) => ({
    getGroupDetails: build.mutation({
      query: ({ group_id, user_id }) => ({
        url: "api/getGroupDetail",
        method: "GET",
        params: { group_id, user_id },
      }),
    }),
    getGroup: build.mutation({
      query: (payload) => ({
        url: "api/getGroupByUserId",
        method: "GET",
        params: payload,
      }),
    }),
    postAddGroup: build.mutation({
      query: (payload) => ({
        url: "api/addGroupByUserId",
        method: "POST",
        body: payload,
      }),
    }),
    getTrip: build.mutation({
      query: (payload) => ({
        url: "api/getTripByGroupId",
        method: "GET",
        params: payload,
      }),
    }),
    postAddTrip: build.mutation({
      query: (payload) => ({
        url: "api/addTripByGroupId",
        method: "POST",
        body: payload,
      }),
    }),
    postAddMultipleTrips: build.mutation({
      query: (payload) => ({
        url: "api/addMultipleTripsByGroupId",
        method: "POST",
        body: payload,
      }),
    }),
    postEditTrip: build.mutation({
      query: (payload) => ({
        url: "api/editTripByGroupId",
        method: "POST",
        body: payload,
      }),
    }),
    postEditTripMem: build.mutation({
      query: (payload) => ({
        url: "api/editTripMem",
        method: "POST",
        body: payload,
      }),
    }),
    getAllTrip: build.mutation({
      query: (payload) => ({
        url: "api/getAllTrip",
        method: "GET",
        params: payload,
      }),
    }),
    getMember: build.mutation({
      query: (payload) => ({
        url: "api/getMemberByGroupId",
        method: "GET",
        params: payload,
      }),
    }),
    deleteMember: build.mutation({
      query: (payload) => ({
        url: `api/members/${payload}`,
        method: "DELETE",
      }),
    }),
    getAllMember: build.mutation({
      query: (payload) => ({
        url: "api/getAllMember",
        method: "GET",
        params: payload,
      }),
    }),
    postAddMember: build.mutation({
      query: (payload) => ({
        url: "api/addMemberByGroupId",
        method: "POST",
        body: payload,
      }),
    }),
    postEditMember: build.mutation({
      query: (payload) => ({
        url: "api/editMemberByMemberId",
        method: "POST",
        body: payload,
      }),
    }),
    deleteGroup: build.mutation({
      query: (payload) => ({
        url: "api/deleteGroupById",
        method: "DELETE",
        body: payload,
      }),
    }),
    postLogin: build.mutation({
      query: (payload) => ({
        url: "auth/login",
        method: "POST",
        body: payload,
      }),
      // Optionally, store the token after login
      async onQueryStarted(payload, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // Assuming the token is in data.token
          sessionStorage.setItem("token", data.token);
        } catch (error) {
          // Handle error
        }
      },
    }),
    postRegister: build.mutation({
      query: (payload) => ({
        url: "auth/register",
        method: "POST", // Corrected method to POST
        body: payload,
      }),
    }),
    getAllUsers: build.mutation({
      query: () => ({
        url: "api/listUsers",
        method: "GET",
      }),
    }),
    updateGroupVisibility: build.mutation({
      query: (payload) => ({
        url: "api/updateGroupVisibility",
        method: "POST",
        body: payload,
      }),
    }),
    getGroupVisibility: build.mutation({
      query: ({ group_id }) => ({
        url: "api/getGroupVisibility",
        method: "GET",
        params: { group_id },
      }),
    }),
    userSearch: build.mutation({
      query: ({ filterBy, searchWords = "ALL", excludeIds = [] }) => ({
        url: "api/userSearch",
        method: "GET",
        params: { filterBy, searchWords, excludeIds },
      }),
    }),
    deleteTrip: build.mutation({
      query: ({ trip_id, group_id }) => ({
        url: "api/deleteTripById",
        method: "DELETE",
        body: { trip_id, group_id }, // Sending the required parameters in the request body
      }),
    }),
    askDatabase: build.mutation({
      query: (payload) => ({
        url: "openai/askDatabase",
        method: "POST",
        body: payload,
      }),
    }),
    translateMessage: build.mutation({
      query: (param) => ({
        url: `/openai/translate`,
        method: "GET",
        params: param, // Passing the message as a query parameter
      }),
    }),
    receiptText: build.mutation({
      query: (param) => ({
        url: `/openai/receiptText`,
        method: "GET",
        params: param, // Passing the message as a query parameter
      }),
    }),
    updateUserInfo: build.mutation({
      query: (payload) => ({
        url: "api/updateUserInfo",
        method: "PUT",
        body: payload,
      }),
    }),
    getUserProfile: build.query({
      query: () => ({
        url: "api/getUserProfile",
        method: "GET",
      }),
    }),
    uploadImage: build.mutation({
      query: (formData) => ({
        url: "api/uploadImage", // Use the new backend endpoint
        method: "POST",
        body: formData, // Send the FormData object
      }),
    }),
  }),
});

export const {
  usePostLoginMutation,
  usePostRegisterMutation,
  usePostAddGroupMutation,
  useGetGroupMutation,
  useGetTripMutation,
  usePostAddTripMutation,
  usePostEditTripMutation,
  usePostEditTripMemMutation,
  useGetAllTripMutation,
  useGetMemberMutation,
  useDeleteMemberMutation,
  useGetAllMemberMutation,
  usePostAddMemberMutation,
  usePostEditMemberMutation,
  useDeleteGroupMutation,
  useGetGroupDetailsMutation,
  useGetAllUsersMutation,
  useUpdateGroupVisibilityMutation,
  useGetGroupVisibilityMutation,
  useUserSearchMutation,
  useDeleteTripMutation,
  useAskDatabaseMutation,
  useTranslateMessageMutation,
  useReceiptTextMutation,
  usePostAddMultipleTripsMutation,
  useUpdateUserInfoMutation,
  useLazyGetUserProfileQuery, // Export the new hook
  useUploadImageMutation, // Export the updated hook
} = api;
