import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_BASE_URL }),
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
    getTrip: build.mutation({
      query: (payload) => ({
        url: "api/getTripByGroupId",
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
    }),
  }),
});

export const {
  usePostLoginMutation,
  useGetGroupMutation,
  useGetTripMutation,
  useGetMemberMutation,
  usePostAddMemberMutation,
  usePostEditMemberMutation,
} = api;