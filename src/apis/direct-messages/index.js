import axiosInstance from '@/config/axiosConfig';

export const sendDirectMessageRequest = async ({ workspaceId, memberId, body, image, token }) => {
    const res = await axiosInstance.post(
        `/workspaces/${workspaceId}/members/${memberId}/messages`,
        { body, image },
        { headers: { 'x-access-token': token } }
    );
    // backend uses a { data, message } envelope
    return res?.data?.data;
};
