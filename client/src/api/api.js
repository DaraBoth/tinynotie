import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Function to get the JWT token from localStorage
const getToken = () => localStorage.getItem('token');

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_BASE_URL,
    prepareHeaders: (headers) => {
      // Get the token from localStorage
      const token = getToken();

      // If we have a token, set the Authorization header
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      return headers;
    }
  }),
  reducerPath: "main",
  tagTypes: [],
  endpoints: (build) => ({
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
          localStorage.setItem('token', data.token);
        } catch (error) {
          // Handle error
        }
      },
    }),
    postRegister: build.mutation({
      query: (payload) => ({
        url: "auth/register",
        method: "POST",  // Corrected method to POST
        body: payload,
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
} = api;
