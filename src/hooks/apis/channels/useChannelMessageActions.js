import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getPreginedUrl, uploadImageToAWSpresignedUrl } from '@/apis/s3';
import { useAuth } from '@/hooks/context/useAuth';
import { useCurrentWorkspace } from '@/hooks/context/useCurrentWorkspace';
import { useSocket } from '@/hooks/context/useSocket';
import {
    applyThreadMessage,
    createClientId,
    messagesQueryKey,
    patchMessage,
    patchThreadMessage,
    removeMessageById,
    threadMessagesQueryKey,
    upsertMessage
} from '@/lib/messageCache';

/**
 * Optimistic send/react/star/edit/delete for a single channel's message
 * list. Every mutation updates the ['messages', workspaceId, channelId]
 * cache immediately and rolls back on server rejection.
 *
 * Every action except `sendMessage` also accepts an optional trailing
 * `threadId`: thread replies are rendered from a separate `{ rootMessage,
 * replies }` cache (see lib/messageCache), not the channel's paginated
 * cache, so mutating a reply must be routed there instead — this is what
 * lets ThreadPanel reuse this same hook safely for its own message actions.
 */
export const useChannelMessageActions = (channelId) => {
    const { socket } = useSocket();
    const { auth } = useAuth();
    const { currentWorkspace } = useCurrentWorkspace();
    const queryClient = useQueryClient();
    const workspaceId = currentWorkspace?._id;
    const queryKey = messagesQueryKey(workspaceId, channelId);

    const applyUpdated = useCallback((updatedMessage, threadId) => {
        if (threadId) {
            applyThreadMessage(queryClient, threadId, updatedMessage);
        } else {
            upsertMessage(queryClient, queryKey, updatedMessage);
        }
    }, [queryClient, queryKey]);

    const applyPatch = useCallback((messageId, patchFn, threadId) => {
        return threadId
            ? patchThreadMessage(queryClient, threadId, messageId, patchFn)
            : patchMessage(queryClient, queryKey, messageId, patchFn);
    }, [queryClient, queryKey]);

    const sendMessage = useCallback(async ({ body, image, mentions, parentMessage }) => {
        if (!socket || !channelId) return;

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
            channelId,
            workspaceId,
            parentMessage,
            senderId: auth?.user,
            mentions: [],
            reactions: [],
            stars: [],
            createdAt: new Date().toISOString(),
            isPending: true
        };

        // Thread replies render in their own panel, not the channel view —
        // insert into whichever cache actually displays them.
        if (parentMessage) {
            queryClient.setQueryData(threadMessagesQueryKey(parentMessage), (existing) => {
                if (!existing) return existing;
                return { ...existing, replies: [...existing.replies, optimisticMessage] };
            });
        } else {
            upsertMessage(queryClient, queryKey, optimisticMessage);
        }

        return new Promise((resolve) => {
            socket.emit('NewMessage', {
                channelId,
                body,
                image: fileUrl,
                mentions: mentions || [],
                parentMessage,
                clientId
            }, (response) => {
                if (response?.success) {
                    if (parentMessage) {
                        queryClient.setQueryData(threadMessagesQueryKey(parentMessage), (existing) => {
                            if (!existing) return existing;
                            const replies = existing.replies.map((reply) =>
                                (reply._id === clientId ? response.data : reply)
                            );
                            return { ...existing, replies };
                        });
                    } else {
                        upsertMessage(queryClient, queryKey, response.data);
                    }
                    resolve(response.data);
                } else {
                    if (parentMessage) {
                        queryClient.setQueryData(threadMessagesQueryKey(parentMessage), (existing) => {
                            if (!existing) return existing;
                            return { ...existing, replies: existing.replies.filter((reply) => reply._id !== clientId) };
                        });
                    } else {
                        removeMessageById(queryClient, queryKey, clientId);
                    }
                    toast.error('Message failed to send', { description: response?.message });
                    resolve(null);
                }
            });
        });
    }, [socket, channelId, workspaceId, auth?.token, auth?.user, queryClient, queryKey]);

    const toggleReaction = useCallback((messageId, emoji, threadId) => {
        if (!socket || !auth?.user?._id) return;

        const userId = auth.user._id;
        const previous = applyPatch(messageId, (message) => {
            const existingIndex = (message.reactions || []).findIndex(
                (r) => r.body === emoji && (r.memberId?._id || r.memberId) === userId
            );
            const reactions = [...(message.reactions || [])];
            if (existingIndex > -1) {
                reactions.splice(existingIndex, 1);
            } else {
                reactions.push({ body: emoji, memberId: userId });
            }
            return { ...message, reactions };
        }, threadId);

        socket.emit('ADD_REACTION', { messageId, emoji, channelId }, (response) => {
            if (response?.success) {
                applyUpdated(response.data, threadId);
            } else if (previous) {
                applyUpdated(previous, threadId);
                toast.error('Could not react to message', { description: response?.message });
            }
        });
    }, [socket, auth?.user?._id, channelId, applyPatch, applyUpdated]);

    const toggleStar = useCallback((messageId, threadId) => {
        if (!socket || !auth?.user?._id) return;

        const userId = auth.user._id;
        const previous = applyPatch(messageId, (message) => {
            const stars = message.stars || [];
            const isStarred = stars.includes(userId);
            return { ...message, stars: isStarred ? stars.filter((id) => id !== userId) : [...stars, userId] };
        }, threadId);

        socket.emit('TOGGLE_STAR_MESSAGE', { messageId, channelId }, (response) => {
            if (response?.success) {
                applyUpdated(response.data, threadId);
            } else if (previous) {
                applyUpdated(previous, threadId);
                toast.error('Could not star message', { description: response?.message });
            }
        });
    }, [socket, auth?.user?._id, channelId, applyPatch, applyUpdated]);

    const editMessage = useCallback((messageId, body, threadId) => {
        if (!socket) return Promise.resolve(false);

        const previous = applyPatch(messageId, (message) => ({
            ...message,
            body,
            isEdited: true
        }), threadId);

        return new Promise((resolve) => {
            socket.emit('EDIT_MESSAGE', { messageId, body, channelId }, (response) => {
                if (response?.success) {
                    applyUpdated(response.data, threadId);
                    resolve(true);
                } else {
                    if (previous) applyUpdated(previous, threadId);
                    toast.error('Could not edit message', { description: response?.message });
                    resolve(false);
                }
            });
        });
    }, [socket, channelId, applyPatch, applyUpdated]);

    const deleteMessage = useCallback((messageId, threadId) => {
        if (!socket) return;

        const previous = applyPatch(messageId, (message) => ({
            ...message,
            deletedAt: new Date().toISOString()
        }), threadId);

        socket.emit('DELETE_MESSAGE', { messageId, channelId }, (response) => {
            if (response?.success) {
                applyUpdated(response.data, threadId);
            } else if (previous) {
                applyUpdated(previous, threadId);
                toast.error('Could not delete message', { description: response?.message });
            }
        });
    }, [socket, channelId, applyPatch, applyUpdated]);

    const togglePin = useCallback((messageId, threadId) => {
        if (!socket) return;

        socket.emit('TOGGLE_PIN_MESSAGE', { messageId, channelId }, (response) => {
            if (response?.success) {
                applyUpdated(response.data, threadId);
            } else {
                toast.error('Could not pin message', { description: response?.message });
            }
        });
    }, [socket, channelId, applyUpdated]);

    return { sendMessage, toggleReaction, toggleStar, editMessage, deleteMessage, togglePin };
};
