// src/types/api.ts

import { useMutation } from "@tanstack/react-query";

export type Token = {
    accessToken: string;
    expiresAt: number;
  };
  
  export type Users = {
    id: number;
    usernm: string;
    token: Token;
  };
  
  // Group related types
  export interface Group {
    id: number;
    grp_name: string;
    admin_id: number;
    status: number;
    description?: string;
    currency: string;
    create_date: string;
    update_date: string;
    members: Member[]; // Added to Group
    trips: Trip[]; // Added to Group
  }
  
  export interface ApiRequestOptions {
    url: string;
    method?: "GET" | "POST" | "PUT" | "DELETE";
    data?: Record<string, unknown>;
    params?: Record<string, string>;
    fetchType?: "client" | "server";
  }
  
  export interface UseGroupsResult {
    res: GroupRes;
    isLoading: boolean;
    error: unknown;
    addGroup: ReturnType<typeof useMutation>;
  }
  
  export type GroupRes = {
    data: Group[];
    status: boolean;
  };
  
  export type AddGroupVariables = {
    grp_name: string;
    status: number;
    description?: string;
    currency?: string;
    member: string[]; // An array of member names
  };
  
  export interface MemberResponse {
    status: boolean;
    data: Member[];
  }
  
  export interface Member {
    id: number;
    mem_name: string;
    paid?: number; // assuming 'paid' is optional and represents amount paid by the member
    group_id: number;
  }
  
  export interface Trip {
    id: number;
    trp_name: string;
    spend: number;
    mem_id: string[]; // List of member IDs involved in the trip
    group_id: number;
    status: number;
    description?: string;
    create_date: string;
    update_dttm: string;
  }
  
  export interface UseGroupDataResult {
    members: ApiResponse<Member[]> | undefined;
    trips: ApiResponse<Trip[]> | undefined;
    isLoading: boolean;
    error: unknown;
  }
  
  export interface ApiResponse<T> {
    status: boolean;
    data: T;
  }
  