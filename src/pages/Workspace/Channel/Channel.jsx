import { Loader2Icon, TriangleAlertIcon, Pin, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { ChannelHeader } from '@/components/molecules/Channel/ChannelHeader';
import { ChatInput } from '@/components/molecules/ChatInput/ChatInput';
import { Message } from '@/components/molecules/Message/Message';
import { TypingIndicator } from '@/components/molecules/TypingIndicator/TypingIndicator';
import { HuddleRoom } from '@/components/organisms/HuddleRoom/HuddleRoom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGetChannelById } from '@/hooks/apis/channels/useGetChannelById';
import { useGetChannelMessages } from '@/hooks/apis/channels/useGetChannelMessages';
import { useChannelMessageActions } from '@/hooks/apis/channels/useChannelMessageActions';
import { useSocket } from '@/hooks/context/useSocket';
import { useMarkChannelAsRead } from '@/hooks/apis/read-receipts/useMarkChannelAsRead';
import { useWebRTC } from '@/hooks/webrtc/useWebRTC';
import { buildEditorDraftFromText } from '@/utils/aiDraft';
import { useAuth } from '@/hooks/context/useAuth';

export const Channel = () => {
    // Standard UI Contexts bounds mapping deeply natively
    const { workspaceId, channelId } = useParams();

    const { activeHuddleChannel, joinChannel, leaveCurrentChannel, socket } = useSocket();
    const [isExpanded, setIsExpanded] = useState(false);
    const [replySeedValue, setReplySeedValue] = useState('');
    const [showHuddleAiPrompt, setShowHuddleAiPrompt] = useState(false);
    const [isSummaryDismissed, setIsSummaryDismissed] = useState(false);
    const { auth } = useAuth(); // Needed to pass the memberId
    const { channelDetails, isFetching, isError } = useGetChannelById(channelId);

    const {
        messages,
        isFetching: isFetchingMessages,
        isFetchingNextPage,
        hasOlderMessages,
        loadOlderMessages
    } = useGetChannelMessages(workspaceId, channelId);

    const { sendMessage, toggleReaction, toggleStar, editMessage, deleteMessage, togglePin } =
        useChannelMessageActions(channelId);

    const { markAsRead } = useMarkChannelAsRead();

    const hasAiAccess = channelDetails?.aiAccess ?? auth?.user?.plan === 'Paid';
    const webrtc = useWebRTC(channelId, hasAiAccess);

    const messageContainerListRef = useRef(null);
    const visibleSummary = webrtc.latestSummary || channelDetails?.latestHuddleSummary;

    // --- Channel room lifecycle: leave the previous channel, join the new
    // one, on every route change to a different channel. The cleanup runs
    // both on channelId change and on unmount (route away / workspace
    // switch / component teardown), so no stale room subscription survives.
    useEffect(() => {
        if (!channelId) return undefined;

        joinChannel(channelId);

        return () => {
            leaveCurrentChannel();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- join/leave identity is stable per socket
    }, [channelId]);

    useEffect(() => {
        if (!isFetching && !isError && workspaceId) {
            markAsRead({ channelId, workspaceId });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFetching, isError, channelId, workspaceId]);

    // Preserve scroll position when older messages are prepended: capture
    // the scroll height before the DOM updates, then restore the same
    // distance from the bottom afterwards instead of resetting to top/bottom.
    const previousScrollHeightRef = useRef(null);
    const isLoadingOlderRef = useRef(false);
    const hasScrolledInitiallyRef = useRef(false);

    // A fresh channel always needs its own "first paint" scroll-to-bottom,
    // regardless of where the previous channel's scroll ended up.
    useEffect(() => {
        hasScrolledInitiallyRef.current = false;
    }, [channelId]);

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

        // New message: stick to the bottom only if the user was already
        // near it (avoids yanking them down while reading back).
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

    useEffect(() => {
        if (visibleSummary && !webrtc.isHuddleActive && hasAiAccess && !isSummaryDismissed) {
            const timer = setTimeout(() => {
                setIsSummaryDismissed(true);
            }, 10 * 60 * 1000);
            return () => clearTimeout(timer);
        }
    }, [visibleSummary, webrtc.isHuddleActive, hasAiAccess, isSummaryDismissed]);

    const handleSendMessage = async ({ body, image, mentions }) => {
        await sendMessage({ body, image, mentions });
    };

    const handleRequestAiReply = (messageId) => new Promise((resolve) => {
        if (!hasAiAccess || !auth?.token) {
            resolve([]);
            return;
        }

        const messageIndex = messages.findIndex((message) => message._id === messageId);
        const targetMessage = messages[messageIndex];
        const recentMessages = messages
            .slice(Math.max(0, messageIndex - 4), messageIndex)
            .map((message) => ({
                body: message.body,
                senderName: message.senderId?.username
            }));

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

    const handleStartHuddle = async () => {
        if (!hasAiAccess) {
            await webrtc.startHuddle({ enableAi: false });
            return;
        }

        setShowHuddleAiPrompt(true);
    };

    const handleHuddleAiChoice = async (enableAi) => {
        setShowHuddleAiPrompt(false);
        await webrtc.startHuddle({ enableAi });
    };

    if(isFetching) {
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
                <span className='text-sm text-muted-foreground'>Channel Not found</span>
            </div>
        );
    }

    const pinnedMessages = messages?.filter(m => m.isPinned && !m.deletedAt) || [];
    const isHuddleLiveInChannel = activeHuddleChannel === channelId;

    return (
        <div className='flex flex-col h-full relative'>
            <Dialog open={showHuddleAiPrompt} onOpenChange={setShowHuddleAiPrompt}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Turn On Huddle AI For This Meeting?</DialogTitle>
                        <DialogDescription>
                            We can capture transcript snippets and generate a summary for this huddle. If you choose not now, the huddle will still start with AI notes off for this meeting.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className='sm:justify-start'>
                        <Button variant="outline" onClick={() => handleHuddleAiChoice(false)}>
                            Start Without AI
                        </Button>
                        <Button onClick={() => handleHuddleAiChoice(true)}>
                            Turn On AI
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ChannelHeader
                name={channelDetails?.name}
                channelId={channelId}
                isHuddleActive={webrtc.isHuddleActive}
                startHuddle={handleStartHuddle}
                isHuddleLiveInChannel={isHuddleLiveInChannel}
            />

            {webrtc.isHuddleActive && (
                <div className={`absolute z-50 bg-[#09090b] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden rounded-[20px] border border-white/10 ring-1 ring-white/5 cursor-default transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isExpanded
                    ? "inset-4 w-auto h-auto rounded-[32px] shadow-[0_0_100px_rgba(0,0,0,0.8)]"
                    : "bottom-[20px] right-[20px] w-[340px] h-[260px]"
                }`}>
                    <HuddleRoom {...webrtc} isExpanded={isExpanded} toggleExpand={() => setIsExpanded(prev => !prev)} />
                </div>
            )}

            {pinnedMessages.length > 0 && (
                <div className="bg-white border-b px-5 py-2 shadow-[0_2px_4px_rgba(0,0,0,0.02)] z-10 max-h-[20vh] overflow-y-auto w-full">
                    <div className="text-[11px] font-bold text-slate-500 mb-2 flex items-center gap-1 uppercase tracking-wider">
                        <Pin className="h-3 w-3" /> {pinnedMessages.length} Pinned {pinnedMessages.length === 1 ? 'Message' : 'Messages'}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        {pinnedMessages.map((msg) => (
                            <div key={`pin-${msg._id}`} className="text-sm px-3 py-2 bg-yellow-50/80 rounded-md border border-yellow-200/60 flex flex-col gap-0.5 hover:bg-yellow-100/50 transition-colors">
                                <span className="font-semibold text-xs text-slate-800">{msg.senderId?.username}</span>
                                <div className="text-slate-600 text-[11px] line-clamp-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.body }} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {visibleSummary && !webrtc.isHuddleActive && hasAiAccess && !isSummaryDismissed && (
                <div className="px-5 py-4 w-full">
                    <div className="relative w-full rounded-xl border border-purple-600/30 bg-[#13151a] p-4 flex gap-4 overflow-hidden">
                        {/* Glow effect */}
                        <div className="absolute top-0 left-0 w-64 h-full bg-purple-600/5 blur-[50px] pointer-events-none"></div>

                        <div className="shrink-0 pt-1">
                            <div className="size-10 rounded-full bg-purple-600/20 flex items-center justify-center">
                                <Sparkles className="size-5 text-purple-400" />
                            </div>
                        </div>

                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-purple-400 mb-2">LATEST HUDDLE SUMMARY</p>
                                <button
                                    onClick={() => setIsSummaryDismissed(true)}
                                    className="text-slate-500 hover:text-slate-300 transition-colors p-1"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            <p className="mt-1 text-sm text-slate-300 leading-relaxed">{visibleSummary?.overview}</p>

                            {visibleSummary?.actionItems?.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {visibleSummary.actionItems.map((item) => (
                                        <span key={item} className="rounded-md bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 text-xs font-medium text-purple-200">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* We need to make sure that below div is scrollable for the messages */}
            <div
                ref={messageContainerListRef}
                onScroll={handleScroll}
                className='flex-1 overflow-y-auto p-5 gap-y-2'
            >
                {isFetchingNextPage && (
                    <div className='flex items-center justify-center py-2'>
                        <Loader2Icon className='size-4 animate-spin text-muted-foreground' />
                    </div>
                )}

                {isFetchingMessages && !messages?.length && (
                    <div className='h-full flex items-center justify-center'>
                        <Loader2Icon className='size-5 animate-spin text-muted-foreground' />
                    </div>
                )}

                {messages?.map((message) => {
                    return (
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
                            isEdited={message.isEdited}
                            deletedAt={message.deletedAt}
                            isPinned={message.isPinned}
                            stars={message.stars}
                        />
                    );
                })}
            </div>

            <TypingIndicator />
            <ChatInput
                seedValue={replySeedValue}
                onSubmit={handleSendMessage}
                draftScope={workspaceId && channelId ? { workspaceId, channelId } : null}
            />
        </div>
    );
};
