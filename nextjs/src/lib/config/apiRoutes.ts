import axiosClient from "../instance/axiosClient";
import axiosServer from "../instance/axiosServer";

const API_ROUTES = {
    getGroupByUserId: (userId: number) => `/api/getGroupByUserId?user_id=${userId}`,
    addGroupByUserId: () => `/api/addGroupByUserId`,
    getAllMembers: () => `/api/getAllMember`,
    getGroupDetails: (groupId: string, userId: string) => ({
        url: `/api/getGroupDetails?group_id=${groupId}&user_id=${userId}`,
        method: 'GET',
    }),
    getGroupMembers: (groupId: number) => `/api/getGroupMembers?group_id=${groupId}`,
    getGroupTrips: (groupId: number) => `/api/getGroupTrips?group_id=${groupId}`,
};

export const apiRequest = async <T = any>({
    url,
    method = 'GET',
    data = {},
    params = {},
    fetchType = 'client',
}: {
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | string;
    data?: Record<string, unknown>;
    params?: Record<string, string>;
    fetchType?: 'client' | 'server';
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
        }
        return response.data;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
};

export default API_ROUTES;
