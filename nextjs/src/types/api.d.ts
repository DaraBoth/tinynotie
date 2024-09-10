// src/types/api.ts
export interface Group {
    id: string;
    grp_name: string;
    description?: string;
    status?: number;
    admin_id?: number;
    currency?: string;
    visibility?: string;
    create_date?: string;
}

export interface ApiRequestOptions {
    url: string;
    method?: "GET" | "POST" | "PUT" | "DELETE";
    data?: Record<string, unknown>;
    params?: Record<string, string>;
    fetchType?: "client" | "server";
}

export interface UseGroupsResult {
    res: GroupRes
    isLoading: boolean;
    error: unknown;
    addGroup: ReturnType<typeof useMutation>;
}

export type GroupRes = {
    data: Group[];
    status: boolean
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
    mem_name: string;
}