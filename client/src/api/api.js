import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_BASE_URL }),
  reducerPath: "main",
  tagTypes: [],
  endpoints: (build) => ({
    getUser: build.mutation({
      query: (payload) => ({
        url: "note/getUser",
        method: "GET",
        body: payload,
      }),
    }),
  }),
});