import { XIcon, Loader2Icon, TriangleAlertIcon } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

import { useThread } from '@/context/ThreadContext';
import { Button } from '@/components/ui/button';
import { useGetThreadMessages } from '@/hooks/apis/threads/useGetThreadMessages';
import { useMarkThreadAsRead } from '@/hooks/apis/threads/useMarkThreadAsRead';
import { useCurrentWorkspace } from '@/hooks/context/useCurrentWorkspace';
import { useChannelMessageActions } from '@/hooks/apis/channels/useChannelMessageActions';
import { Message } from '@/components/molecules/Message/Message';
import { ChatInput } from '@/components/molecules/ChatInput/ChatInput';
import { useAuth } from '@/hooks/context/useAuth';
import { useSocket } from '@/hooks/context/useSocket';
import { buildEditorDraftFromText } from '@/utils/aiDraft';

export const ThreadPanel = () => {
    const { activeThreadMessageId, closeThread } = useThread();
    const { currentWorkspace } = useCurrentWorkspace();
    const { workspaceId } = useParams();
    const { auth } = useAuth();
    const { socket, currentChannel } = useSocket();
    const [replySeedValue, setReplySeedValue] = useState('');
    const hasAiAccess = auth?.user?.plan === 'Paid';

    const effectiveWorkspaceId = currentWorkspace?._id || workspaceId;

    const { rootMessage, messages, isFetching, isError } = useGetThreadMessages({
        workspaceId: effectiveWorkspaceId,
        threadId: activeThreadMessageId
    });

    const { markThreadAsRead } = useMarkThreadAsRead(effectiveWorkspaceId);
    const {
        sendMessage,
        toggleReaction: toggleReactionInChannel,
        toggleStar: toggleStarInChannel,
        editMessage: editMessageInChannel,
        deleteMessage: deleteMessageInChannel,
        togglePin: togglePinInChannel
    } = useChannelMessageActions(currentChannel);

    // Every message rendered in this panel (root + replies) lives in the
    // thread cache, not the channel cache — bind threadId so mutations land
    // in the right place (see useChannelMessageActions' threadId param).
    const toggleReaction = (messageId, emoji) => toggleReactionInChannel(messageId, emoji, activeThreadMessageId);
    const toggleStar = (messageId) => toggleStarInChannel(messageId, activeThreadMessageId);
    const editMessage = (messageId, body) => editMessageInChannel(messageId, body, activeThreadMessageId);
    const deleteMessage = (messageId) => deleteMessageInChannel(messageId, activeThreadMessageId);
    const togglePin = (messageId) => togglePinInChannel(messageId, activeThreadMessageId);

    // Mark the thread read as soon as it is opened, and again as new replies
    // arrive while it stays open.
    useEffect(() => {
        if (activeThreadMessageId) {
            markThreadAsRead(activeThreadMessageId);
        }
    }, [activeThreadMessageId, messages.length, markThreadAsRead]);

    const handleSubmit = async ({ body, image }) => {
        await sendMessage({ body, image, parentMessage: activeThreadMessageId });
    };

    const handleRequestAiReply = (messageId) => new Promise((resolve) => {
        if (!hasAiAccess || !auth?.token) {
            resolve([]);
            return;
        }

        const allMessages = [rootMessage, ...messages].filter(Boolean);
        const messageIndex = allMessages.findIndex((message) => message._id === messageId);
        const targetMessage = messageIndex >= 0 ? allMessages[messageIndex] : null;
        const recentMessages = messageIndex >= 0
            ? allMessages.slice(Math.max(0, messageIndex - 4), messageIndex).map((message) => ({
                body: message.body,
                senderName: message.senderId?.username
            }))
            : [];

        socket.emit('GENERATE_AI_REPLY', {
            targetMessage: {
                body: targetMessage?.body,
                senderName: targetMessage?.senderId?.username
            },
            recentMessages
        }, (response) => {
            resolve(response?.success ? response.data || [] : []);
        });
    });

    const handleUseAiReply = (text) => {
        setReplySeedValue('');
        window.requestAnimationFrame(() => {
            setReplySeedValue(buildEditorDraftFromText(text));
        });
    };

    if (!activeThreadMessageId) return null;

    return (
        <div className="flex flex-col h-full bg-white border-l shadow-sm w-full">
            {/* Header */}
            <div className="flex justify-between items-center px-4 h-12 border-b bg-gray-50/80">
                <span className="font-bold text-sm">Thread</span>
                <Button variant="ghost" size="iconSm" onClick={closeThread}>
                    <XIcon className="h-4 w-4" />
                </Button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-y-2">
                {isFetching && (
                    <div className='flex-1 flex items-center justify-center'>
                        <Loader2Icon className='size-5 animate-spin text-muted-foreground' />
                    </div>
                )}

                {isError && (
                    <div className='flex flex-col items-center justify-center flex-1 h-full gap-y-2'>
                        <TriangleAlertIcon className='size-6 text-muted-foreground' />
                        <span className='text-sm text-muted-foreground'>Failed to load thread</span>
                    </div>
                )}

                {!isFetching && !isError && rootMessage && (
                    <>
                        <Message
                            messageId={rootMessage._id}
                            author={rootMessage.senderId}
                            authorId={rootMessage.senderId?._id}
                            body={rootMessage.body}
                            authorName={rootMessage.senderId?.username}
                            createdAt={rootMessage.createdAt}
                            image={rootMessage.image}
                            reactions={rootMessage.reactions || []}
                            onAddReaction={toggleReaction}
                            onToggleStar={toggleStar}
                            onEdit={editMessage}
                            onDelete={deleteMessage}
                            onTogglePin={togglePin}
                            isReply={true}
                            isEdited={rootMessage.isEdited}
                            deletedAt={rootMessage.deletedAt}
                            isPinned={rootMessage.isPinned}
                            stars={rootMessage.stars}
                        />
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1 pt-2 pb-1">
                            {messages.length} {messages.length === 1 ? 'reply' : 'replies'}
                        </div>
                    </>
                )}

                {!isFetching && !isError && messages?.map((message) => (
                    <Message
                        key={message._id}
                        messageId={message._id}
                        author={message.senderId}
                        authorId={message.senderId?._id}
                        body={message.body}
                        authorName={message.senderId?.username}
                        createdAt={message.createdAt}
                        image={message.image}
                        reactions={message.reactions || []}
                        isPending={message.isPending}
                        onAddReaction={toggleReaction}
                        onToggleStar={toggleStar}
                        onEdit={editMessage}
                        onDelete={deleteMessage}
                        onTogglePin={togglePin}
                        onRequestAiReply={handleRequestAiReply}
                        onUseAiReply={handleUseAiReply}
                        showAiReplyAction={hasAiAccess}
                        // Disable replying to a reply to keep threads 1-level deep
                        isReply={true}
                        isEdited={message.isEdited}
                        deletedAt={message.deletedAt}
                        isPinned={message.isPinned}
                        stars={message.stars}
                    />
                ))}

                {!isFetching && !isError && messages?.length === 0 && (
                    <div className="flex flex-col items-center justify-center flex-1 text-gray-500 text-sm mt-10">
                        No replies yet. Start the conversation!
                    </div>
                )}
            </div>

            {/* Thread Editor */}
            <div className="p-4 border-t bg-gray-50/50">
                <ChatInput onSubmit={handleSubmit} seedValue={replySeedValue} />
            </div>
        </div>
    );
};
