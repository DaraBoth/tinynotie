// src/lib/config/apiRoutes.ts

import { SearchGroupType } from "@/types/api";
import axiosClient from "../instance/axiosClient";
import axiosServer from "../instance/axiosServer";

const API_ROUTES = {
  getGroupByUserId: (userId: number) => `/api/getGroupByUserId?user_id=${userId}`,
  addGroupByUserId: () => `/api/addGroupByUserId`,
  getAllMembers: () => `/api/getAllMember`,
  getGroupDetails: (groupId: number, userId: number) => ({
    url: `/api/getGroupDetail?group_id=${groupId}&user_id=${userId}`,
    method: "GET",
  }),
  getGroupMembers: (groupId: number) => `/api/getMemberByGroupId?group_id=${groupId}`,
  getGroupTrips: (groupId: number) => `/api/getTripByGroupId?group_id=${groupId}`,
  addMember: () => `/api/addMemberByGroupId`, // Ensure your backend has this endpoint
  editMemberById: () => `/api/editMemberByMemberId`,
  deleteMember: (memberId: number) => `/api/members/${memberId}`,
  addTrip: () => `/api/addTripByGroupId`,
  editTrip: () => `/api/editTripByGroupId`,
  deleteTrip: () => `/api/deleteTripById`,
  searchGroups: ({ search = null, startDate = null, endDate = null }:SearchGroupType) => `/api/searchGroups?search=${search}&startDate=${startDate}&endDate=${endDate}`,
};

export const apiRequest = async <T = any>({
  url,
  method = "GET",
  data = {},
  params = {},
  fetchType = "client",
}: {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  data?: Record<string, unknown>;
  params?: Record<string, string>;
  fetchType?: "client" | "server";
}): Promise<T> => {
  try {
    let response;
    switch (fetchType) {
      case "server":
        response = await axiosServer({
          url,
          method,
          data,
          params,
        });
        break;
      case "client":
        response = await axiosClient({
          url,
          method,
          data,
          params,
        });
        break;
      default:
        throw new Error("Invalid fetchType");
    }
    return response.data;
  } catch (error) {
    console.error("API Request Error:", error);
    throw error;
  }
};

export default API_ROUTES;
