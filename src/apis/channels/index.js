import axios from '@/config/axiosConfig';

export const getChannelById = async ({ channelId, token }) => {
    try {
        const response = await axios.get(`/channels/${channelId}`, {
            headers: {
                'x-access-token': token
            }
        });
        return response?.data?.data;
    } catch(error) {
        console.log('Error in getChannelByIdRequest', error);
        throw error?.response?.data || error;
    }
};

export const deleteChannelRequest = async ({ channelId, token }) => {
    try {
        const response = await axios.delete(`/channels/${channelId}`, {
            headers: {
                'x-access-token': token
            }
        });
        return response?.data?.data;
    } catch (error) {
        console.log('Error in deleteChannelRequest', error);
        throw error?.response?.data || error;
    }
};

export const updateChannelRequest = async ({ channelId, channelName, token }) => {
    try {
        const response = await axios.put(`/channels/${channelId}`, {
            channelName
        }, {
            headers: {
                'x-access-token': token
            }
        });
        return response?.data?.data;
    } catch (error) {
        console.log('Error in updateChannelRequest', error);
        throw error?.response?.data || error;
    }
};

export const getPaginatedMessages = async ({ channelId, cursor, limit, token }) => {
    try {
        const response = await axios.get(`/messages/${channelId}`, {
            params: {
                limit: limit || 30,
                cursor: cursor || undefined
            },
            headers: {
                'x-access-token': token
            }
        });
        // { items, nextCursor, hasMore }
        return response?.data?.data;
    } catch(error) {
        console.log('Error in getPaginatedMessagesRequest', error);
        throw error?.response?.data || error;
    }
};
