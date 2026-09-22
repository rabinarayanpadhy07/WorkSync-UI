import { Loader2Icon, MessageCircleIcon, TriangleAlertIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

import { EmptyState } from '@/components/atoms/EmptyState/EmptyState';
import { ChannelHeader } from '@/components/molecules/Channel/ChannelHeader';
import { ChatInput } from '@/components/molecules/ChatInput/ChatInput';
import { Message } from '@/components/molecules/Message/Message';
import { TypingIndicator } from '@/components/molecules/TypingIndicator/TypingIndicator';
import { useCurrentWorkspace } from '@/hooks/context/useCurrentWorkspace';
import { useAuth } from '@/hooks/context/useAuth';
import { useGetDirectMessages } from '@/hooks/apis/direct-messages/useGetDirectMessages';
import { useDirectMessageActions } from '@/hooks/apis/direct-messages/useDirectMessageActions';
import { useSocket } from '@/hooks/context/useSocket';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

export const DirectMessage = () => {

    const { workspaceId: routeWorkspaceId, memberId } = useParams();
    const { currentWorkspace } = useCurrentWorkspace();
    const { auth } = useAuth();
    const { socket } = useSocket();
    const workspaceId = routeWorkspaceId || currentWorkspace?._id;

    const {
        messages,
        isFetching,
        isFetchingNextPage,
        hasOlderMessages,
        loadOlderMessages,
        isError,
        error
    } = useGetDirectMessages({ workspaceId, memberId });

    const { sendMessage } = useDirectMessageActions(workspaceId, memberId);

    const messageContainerListRef = useRef(null);

    // Join this conversation's room so realtime delivery works while it is
    // open, and leave it on teardown (route change, workspace switch,
    // unmount) so the socket does not keep accumulating stale DM rooms.
    useEffect(() => {
        if (!socket || !workspaceId || !memberId || !auth?.user?._id) return undefined;

        socket.emit('JoinDirectMessage', { workspaceId, memberId });

        return () => {
            socket.emit('LeaveDirectMessage', { workspaceId, memberId });
        };
    }, [socket, workspaceId, memberId, auth?.user?._id]);

    const previousScrollHeightRef = useRef(null);
    const isLoadingOlderRef = useRef(false);
    const hasScrolledInitiallyRef = useRef(false);

    useEffect(() => {
        hasScrolledInitiallyRef.current = false;
    }, [memberId]);

    useEffect(() => {
        const container = messageContainerListRef.current;
        if (!container || !messages?.length) return;

        if (isLoadingOlderRef.current) {
            const delta = container.scrollHeight - (previousScrollHeightRef.current || 0);
            container.scrollTop += delta;
            isLoadingOlderRef.current = false;
            previousScrollHeightRef.current = null;
            return;
        }

        if (!hasScrolledInitiallyRef.current) {
            container.scrollTop = container.scrollHeight;
            hasScrolledInitiallyRef.current = true;
            return;
        }

        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        if (distanceFromBottom < 200) {
            container.scrollTop = container.scrollHeight;
        }
    }, [messages]);

    const handleScroll = () => {
        const container = messageContainerListRef.current;
        if (!container || isFetchingNextPage || !hasOlderMessages) return;

        if (container.scrollTop < 80) {
            previousScrollHeightRef.current = container.scrollHeight;
            isLoadingOlderRef.current = true;
            loadOlderMessages();
        }
    };

    if (!workspaceId || !memberId) {
        return (
            <div className='h-full flex-1 flex items-center justify-center text-sm text-muted-foreground'>
                Loading workspace conversation...
            </div>
        );
    }

    if(isFetching && !messages.length) {
        return (
            <div
                className='h-full flex-1 flex items-center justify-center'
            >
                <Loader2Icon className='size-5 animate-spin text-muted-foreground' />
            </div>
        );
    }

    if(isError) {
        return (
            <div className='h-full flex-1 flex flex-col gap-y-2 items-center justify-center'>
                <TriangleAlertIcon className='size-6 text-muted-foreground' />
                <span className='text-sm text-muted-foreground'>
                    {getApiErrorMessage(error, 'Conversation could not be opened.')}
                </span>
            </div>
        );
    }

    return (
        <div className='flex flex-col h-full'>
            <ChannelHeader name={'Direct message'} />

            <div
                ref={messageContainerListRef}
                onScroll={handleScroll}
                className='flex flex-1 flex-col overflow-y-auto p-5 gap-y-2'
            >
                {isFetchingNextPage && (
                    <div className='flex items-center justify-center py-2'>
                        <Loader2Icon className='size-4 animate-spin text-muted-foreground' />
                    </div>
                )}

                {messages.length === 0 ? (
                    <EmptyState
                        icon={MessageCircleIcon}
                        title="No messages yet"
                        description="Say hello — messages you send here are private between you and this person."
                    />
                ) : (
                    messages.map((message) => (
                        <Message
                            key={message._id}
                            messageId={message._id}
                            author={message.senderId}
                            authorId={message.senderId?._id}
                            body={message.body}
                            authorName={message.senderId?.username}
                            createdAt={message.createdAt}
                            image={message.image}
                            isPending={message.isPending}
                        />
                    ))
                )}
            </div>

            <TypingIndicator />
            <ChatInput
                draftScope={{ workspaceId, memberId }}
                onSubmit={async ({ body, image }) => {
                    if (!body && !image) return;
                    await sendMessage({ body, image });
                }}
            />
        </div>
    );
};
