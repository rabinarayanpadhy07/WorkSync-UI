import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getPreginedUrl, uploadImageToAWSpresignedUrl } from '@/apis/s3';
import { useAuth } from '@/hooks/context/useAuth';
import { useSocket } from '@/hooks/context/useSocket';
import { createClientId, directMessagesQueryKey, removeMessageById, upsertMessage } from '@/lib/messageCache';
import { sendDirectMessageRequest } from '@/apis/direct-messages';

/**
 * Optimistic DM send with idempotent reconciliation: the optimistic bubble,
 * the socket ack, and the realtime broadcast (handled centrally in
 * SocketContext) all converge on one entry via clientId — see
 * lib/messageCache.upsertMessage.
 */
export const useDirectMessageActions = (workspaceId, memberId) => {
    const { socket } = useSocket();
    const { auth } = useAuth();
    const queryClient = useQueryClient();
    const queryKey = directMessagesQueryKey(workspaceId, memberId);

    const sendMessage = useCallback(async ({ body, image }) => {
        if (!workspaceId || !memberId) return null;

        let fileUrl = null;
        if (image) {
            const preSignedUrl = await getPreginedUrl({ token: auth?.token });
            await uploadImageToAWSpresignedUrl({ url: preSignedUrl, file: image });
            fileUrl = preSignedUrl.split('?')[0];
        }

        const clientId = createClientId();
        const optimisticMessage = {
            _id: clientId,
            clientId,
            body,
            image: fileUrl,
            workspaceId,
            senderId: auth?.user,
            recipientId: memberId,
            createdAt: new Date().toISOString(),
            isPending: true
        };
        upsertMessage(queryClient, queryKey, optimisticMessage);

        if (socket?.connected) {
            return new Promise((resolve) => {
                const timeoutId = window.setTimeout(() => {
                    removeMessageById(queryClient, queryKey, clientId);
                    toast.error('Direct message timed out');
                    resolve(null);
                }, 5000);

                socket.emit('NewDirectMessage', {
                    workspaceId,
                    memberId,
                    body,
                    image: fileUrl,
                    clientId
                }, (response) => {
                    window.clearTimeout(timeoutId);
                    if (response?.success) {
                        upsertMessage(queryClient, queryKey, response.data);
                        resolve(response.data);
                    } else {
                        removeMessageById(queryClient, queryKey, clientId);
                        toast.error('Failed to send direct message', { description: response?.message });
                        resolve(null);
                    }
                });
            });
        }

        // Socket unavailable — fall back to the HTTP endpoint.
        try {
            const httpMessage = await sendDirectMessageRequest({
                workspaceId,
                memberId,
                body,
                image: fileUrl,
                token: auth?.token
            });
            upsertMessage(queryClient, queryKey, { ...httpMessage, clientId });
            return httpMessage;
        } catch (error) {
            removeMessageById(queryClient, queryKey, clientId);
            toast.error('Failed to send direct message');
            throw error;
        }
    }, [workspaceId, memberId, socket, auth?.token, auth?.user, queryClient, queryKey]);

    return { sendMessage };
};
