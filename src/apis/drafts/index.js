import axios from '@/config/axiosConfig';

export const getDraftsRequest = async ({ workspaceId, token }) => {
    try {
        const response = await axios.get(`/workspaces/${workspaceId}/drafts`, {
            headers: { 'x-access-token': token }
        });
        return response?.data?.data || [];
    } catch (error) {
        console.error('Error fetching drafts', error);
        throw error?.response?.data || error;
    }
};

export const getChannelDraftRequest = async ({ workspaceId, channelId, token }) => {
    try {
        const response = await axios.get(`/workspaces/${workspaceId}/drafts/channel/${channelId}`, {
            headers: { 'x-access-token': token }
        });
        return response?.data?.data || null;
    } catch (error) {
        console.error('Error fetching channel draft', error);
        throw error?.response?.data || error;
    }
};

export const upsertChannelDraftRequest = async ({ workspaceId, channelId, body, token }) => {
    try {
        const response = await axios.put(`/workspaces/${workspaceId}/drafts/channel/${channelId}`, { body }, {
            headers: { 'x-access-token': token }
        });
        return response?.data?.data || null;
    } catch (error) {
        console.error('Error saving channel draft', error);
        throw error?.response?.data || error;
    }
};

export const deleteChannelDraftRequest = async ({ workspaceId, channelId, token }) => {
    try {
        await axios.delete(`/workspaces/${workspaceId}/drafts/channel/${channelId}`, {
            headers: { 'x-access-token': token }
        });
    } catch (error) {
        console.error('Error deleting channel draft', error);
        throw error?.response?.data || error;
    }
};

export const getDmDraftRequest = async ({ workspaceId, memberId, token }) => {
    try {
        const response = await axios.get(`/workspaces/${workspaceId}/drafts/dm/${memberId}`, {
            headers: { 'x-access-token': token }
        });
        return response?.data?.data || null;
    } catch (error) {
        console.error('Error fetching DM draft', error);
        throw error?.response?.data || error;
    }
};

export const upsertDmDraftRequest = async ({ workspaceId, memberId, body, token }) => {
    try {
        const response = await axios.put(`/workspaces/${workspaceId}/drafts/dm/${memberId}`, { body }, {
            headers: { 'x-access-token': token }
        });
        return response?.data?.data || null;
    } catch (error) {
        console.error('Error saving DM draft', error);
        throw error?.response?.data || error;
    }
};

export const deleteDmDraftRequest = async ({ workspaceId, memberId, token }) => {
    try {
        await axios.delete(`/workspaces/${workspaceId}/drafts/dm/${memberId}`, {
            headers: { 'x-access-token': token }
        });
    } catch (error) {
        console.error('Error deleting DM draft', error);
        throw error?.response?.data || error;
    }
};
