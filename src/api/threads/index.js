import axios from '@/config/axiosConfig';

export const getThreadsRequest = async ({ workspaceId, cursor, limit, token }) => {
    try {
        const response = await axios.get(`/workspaces/${workspaceId}/threads`, {
            params: { cursor, limit },
            headers: {
                'x-access-token': token
            }
        });
        return response.data.data; // { items, nextCursor, hasMore }
    } catch (error) {
        console.error('Error fetching threads:', error);
        throw error?.response?.data || error;
    }
};

export const getThreadMessagesRequest = async ({ workspaceId, threadId, token }) => {
    try {
        const response = await axios.get(`/workspaces/${workspaceId}/threads/${threadId}/messages`, {
            headers: {
                'x-access-token': token
            }
        });
        return response.data.data; // { rootMessage, replies }
    } catch (error) {
        console.error('Error fetching thread messages:', error);
        throw error?.response?.data || error;
    }
};

export const markThreadAsReadRequest = async ({ workspaceId, threadId, token }) => {
    try {
        await axios.put(`/workspaces/${workspaceId}/threads/${threadId}/read`, {}, {
            headers: {
                'x-access-token': token
            }
        });
    } catch (error) {
        console.error('Error marking thread as read:', error);
        throw error?.response?.data || error;
    }
};
