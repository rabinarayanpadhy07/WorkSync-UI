import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { BACKEND_SOCKET_URL } from '@/config/runtimeConfig';
import { useAuth } from '@/hooks/context/useAuth';
import { useMarkChannelAsRead } from '@/hooks/apis/read-receipts/useMarkChannelAsRead';
import {
    directMessagesQueryKey,
    messagesQueryKey,
    threadMessagesQueryKey,
    upsertMessage
} from '@/lib/messageCache';

const SocketContext = createContext();

const MARK_READ_DEBOUNCE_MS = 800;

export const SocketContextProvider = ({ children }) => {

    const [currentChannel, _setCurrentChannel] = useState(null);
    const currentChannelRef = useRef(null);
    const setCurrentChannel = (val) => {
        currentChannelRef.current = val;
        _setCurrentChannel(val);
    };

    const [typingUsers, setTypingUsers] = useState([]);

    const queryClient = useQueryClient();
    const { auth } = useAuth();
    const { markAsRead } = useMarkChannelAsRead();
    const [onlineUsers, setOnlineUsers] = useState([]);

    // State arrays tracking live connections globally natively
    const [activeHuddleChannel, setActiveHuddleChannel] = useState(null);

    // The socket must present a valid access token on every handshake (and
    // every automatic reconnect), so the connection stays closed until we
    // have one, and `auth` is a function so reconnects always pick up the
    // latest token instead of one captured at socket-creation time.
    const tokenRef = useRef(auth?.token || null);
    const [socket] = useState(() => io(BACKEND_SOCKET_URL, {
        autoConnect: false,
        auth: (cb) => cb({ token: tokenRef.current })
    }));

    const markReadTimersRef = useRef(new Map());
    const debouncedMarkAsRead = useCallback((channelId, workspaceId) => {
        if (!channelId || !workspaceId) return;
        const timers = markReadTimersRef.current;
        clearTimeout(timers.get(channelId));
        timers.set(channelId, setTimeout(() => {
            markAsRead({ channelId, workspaceId }).catch(() => {});
            timers.delete(channelId);
        }, MARK_READ_DEBOUNCE_MS));
    }, [markAsRead]);

    useEffect(() => {
        tokenRef.current = auth?.token || null;

        if (auth?.token) {
            if (!socket.connected) {
                socket.connect();
            }
        } else if (socket.connected) {
            socket.disconnect();
        }
    }, [auth?.token, socket]);

    // --- Channel room lifecycle -------------------------------------------
    // A socket only ever sits in one channel room at a time. Joining a new
    // channel always leaves whatever channel room was previously held, and a
    // fresh transport connection (initial connect, or a reconnect after a
    // drop) does not retain any previous room membership, so the currently
    // open channel is rejoined explicitly.
    const joinChannel = useCallback((channelId) => {
        if (!channelId) return;

        if (currentChannelRef.current && currentChannelRef.current !== channelId) {
            socket.emit('LeaveChannel', { channelId: currentChannelRef.current });
        }

        socket.emit('JoinChannel', { channelId }, (response) => {
            if (response?.success) {
                setCurrentChannel(channelId);
            } else {
                console.error('Failed to join channel', response);
                toast.error('Could not open this channel', {
                    description: response?.message
                });
            }
        });
    }, [socket]);

    const leaveCurrentChannel = useCallback(() => {
        if (currentChannelRef.current) {
            socket.emit('LeaveChannel', { channelId: currentChannelRef.current });
            setCurrentChannel(null);
        }
    }, [socket]);

    useEffect(() => {
        const handleConnect = () => {
            // Room membership does not survive a disconnect/reconnect cycle —
            // rejoin whatever channel was open before the drop.
            if (currentChannelRef.current) {
                socket.emit('JoinChannel', { channelId: currentChannelRef.current });
            }
        };

        const handleDisconnect = () => {
            setTypingUsers([]);
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
        };
    }, [socket]);

    // Logging out (auth.token becoming null) disconnects the socket entirely,
    // which drops every room membership server-side — but local state must
    // also forget the "current channel" so a later reconnect doesn't try to
    // rejoin a channel from a previous session.
    useEffect(() => {
        if (!auth?.token) {
            setCurrentChannel(null);
        }
    }, [auth?.token]);

    useEffect(() => {
        const handleNewMessage = (data) => {
            if (data.parentMessage) {
                // Thread reply: update the thread's own cache, not the main
                // channel view (replies are never shown inline in the channel).
                queryClient.setQueryData(threadMessagesQueryKey(data.parentMessage), (existing) => {
                    if (!existing) return existing;
                    if (existing.replies.some((reply) => reply._id === data._id)) return existing;
                    return { ...existing, replies: [...existing.replies, data] };
                });
                queryClient.invalidateQueries({ queryKey: ['threads'] });
                return;
            }

            upsertMessage(queryClient, messagesQueryKey(data.workspaceId, data.channelId), data);

            const isActiveChannel = currentChannelRef.current === data.channelId;
            const isOwnMessage = data.senderId?._id === auth?.user?._id || data.senderId === auth?.user?._id;

            if (isActiveChannel) {
                if (!isOwnMessage) {
                    debouncedMarkAsRead(data.channelId, data.workspaceId);
                }
                return;
            }

            if (!isOwnMessage) {
                toast.info(`New message from ${data.senderId?.username || 'someone'}`, {
                    description: data.body ? data.body.replace(/<[^>]*>?/gm, '') : 'Sent an image',
                });

                queryClient.setQueryData(['unreadChannels', data.workspaceId], (oldData) => {
                    if (!oldData) return {};
                    const currentUnread = oldData[data.channelId] || 0;
                    return {
                        ...oldData,
                        [data.channelId]: currentUnread + 1
                    };
                });
            }
        };

        const handleMessageMutation = (updatedMessage) => {
            if (updatedMessage.parentMessage) {
                queryClient.setQueryData(threadMessagesQueryKey(updatedMessage.parentMessage), (existing) => {
                    if (!existing) return existing;
                    return {
                        ...existing,
                        replies: existing.replies.map((reply) =>
                            reply._id === updatedMessage._id ? updatedMessage : reply
                        )
                    };
                });
                return;
            }
            upsertMessage(
                queryClient,
                messagesQueryKey(updatedMessage.workspaceId, updatedMessage.channelId),
                updatedMessage
            );
        };

        const handleDirectMessage = (message) => {
            upsertMessage(queryClient, directMessagesQueryKey(message.workspaceId, message.senderId?._id || message.senderId), message);
            upsertMessage(queryClient, directMessagesQueryKey(message.workspaceId, message.recipientId?._id || message.recipientId), message);

            const isOwnMessage = (message.senderId?._id || message.senderId) === auth?.user?._id;
            if (!isOwnMessage) {
                toast.info(`New message from ${message.senderId?.username || 'someone'}`, {
                    description: message.body ? message.body.replace(/<[^>]*>?/gm, '') : 'Sent an image'
                });
            }
        };

        const handleThreadReply = (data) => {
            const isOwnReply = (data.message?.senderId?._id || data.message?.senderId) === auth?.user?._id;
            if (isOwnReply) return;
            toast.info('New reply in thread', {
                description: data.message?.body ? data.message.body.replace(/<[^>]*>?/gm, '') : 'Sent an image'
            });
            queryClient.invalidateQueries({ queryKey: ['threads'] });
        };

        const handleTypingStart = (data) => {
            setTypingUsers((prev) => {
                if (!prev.includes(data.username)) {
                    return [...prev, data.username];
                }
                return prev;
            });
        };

        const handleTypingStop = (data) => {
            setTypingUsers((prev) => prev.filter(u => u !== data.username));
        };

        const handleActiveUsers = (users) => {
            setOnlineUsers(users);
        };

        const handleStatusChanged = ({ userId, isOnline }) => {
            setOnlineUsers(prev => {
                if (isOnline && !prev.includes(userId)) return [...prev, userId];
                if (!isOnline) return prev.filter(u => u !== userId);
                return prev;
            });
        };

        const handleMentionReceived = (data) => {
            toast(`Mentioned by ${data.message.senderId?.username}`, {
                description: `You were mentioned in a recent message.`
            });
        };

        const handleHuddleStarted = (data) => {
            setActiveHuddleChannel(data.channelId);
            if (data.user?._id !== auth?.user?._id) {
                toast.info("🎧 Huddle Started!", {
                    description: `${data.user?.username || 'Someone'} started a Huddle! Click 'Join' to hop in.`
                });
            }
        };

        const handleHuddleEnded = (data) => {
            setActiveHuddleChannel(prev => (prev === data.channelId ? null : prev));
        };

        socket.on('NewMessageReceived', handleNewMessage);
        socket.on('REACTION_ADDED', handleMessageMutation);
        socket.on('MESSAGE_EDITED', handleMessageMutation);
        socket.on('MESSAGE_DELETED', handleMessageMutation);
        socket.on('MESSAGE_PINNED', handleMessageMutation);
        socket.on('MESSAGE_UNPINNED', handleMessageMutation);
        socket.on('MESSAGE_STARRED', handleMessageMutation);
        socket.on('MESSAGE_UNSTARRED', handleMessageMutation);
        socket.on('NewDirectMessageReceived', handleDirectMessage);
        socket.on('ThreadReplyReceived', handleThreadReply);

        socket.on('user_typing_start', handleTypingStart);
        socket.on('user_typing_stop', handleTypingStop);
        socket.on('active_users_list', handleActiveUsers);
        socket.on('user_status_changed', handleStatusChanged);
        socket.on('NewMentionReceived', handleMentionReceived);
        socket.on('HUDDLE_STARTED', handleHuddleStarted);
        socket.on('HUDDLE_ENDED', handleHuddleEnded);

        return () => {
            socket.off('NewMessageReceived', handleNewMessage);
            socket.off('REACTION_ADDED', handleMessageMutation);
            socket.off('MESSAGE_EDITED', handleMessageMutation);
            socket.off('MESSAGE_DELETED', handleMessageMutation);
            socket.off('MESSAGE_PINNED', handleMessageMutation);
            socket.off('MESSAGE_UNPINNED', handleMessageMutation);
            socket.off('MESSAGE_STARRED', handleMessageMutation);
            socket.off('MESSAGE_UNSTARRED', handleMessageMutation);
            socket.off('NewDirectMessageReceived', handleDirectMessage);
            socket.off('ThreadReplyReceived', handleThreadReply);

            socket.off('user_typing_start', handleTypingStart);
            socket.off('user_typing_stop', handleTypingStop);
            socket.off('active_users_list', handleActiveUsers);
            socket.off('user_status_changed', handleStatusChanged);
            socket.off('NewMentionReceived', handleMentionReceived);
            socket.off('HUDDLE_STARTED', handleHuddleStarted);
            socket.off('HUDDLE_ENDED', handleHuddleEnded);
        };
    }, [socket, queryClient, auth?.user?._id, debouncedMarkAsRead]);

    return (
        <SocketContext.Provider value={{
            socket,
            joinChannel,
            leaveCurrentChannel,
            currentChannel,
            typingUsers,
            onlineUsers,
            activeHuddleChannel
        }}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketContext;
