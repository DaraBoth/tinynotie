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
    }),
    postRegister: build.mutation({
      query: (payload) => ({
        url: "auth/register",
        method: "GET",
        params: payload,
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
  useGetAllTripMutation,
  useGetMemberMutation,
  useGetAllMemberMutation,
  usePostAddMemberMutation,
  usePostEditMemberMutation,
} = api;