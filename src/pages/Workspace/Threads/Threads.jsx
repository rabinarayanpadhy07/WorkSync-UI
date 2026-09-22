import { HashIcon, MessageSquareTextIcon, TriangleAlertIcon } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { EmptyState } from '@/components/atoms/EmptyState/EmptyState';
import { Button } from '@/components/ui/button';
import { useThread } from '@/context/ThreadContext';
import { useGetThreads } from '@/hooks/apis/threads/useGetThreads';

const formatTimestamp = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const stripHtml = (value) => (value ? value.replace(/<[^>]*>?/gm, '') : '');

const ThreadRowSkeleton = () => (
    <div className="animate-pulse rounded-2xl border border-white/5 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-2">
            <div className="h-3 w-20 rounded-full bg-white/10" />
            <div className="h-3 w-14 rounded-full bg-white/10" />
        </div>
        <div className="mt-3 h-4 w-3/4 rounded-full bg-white/10" />
        <div className="mt-3 h-3 w-1/2 rounded-full bg-white/5" />
    </div>
);

export const Threads = () => {
    const { workspaceId } = useParams();
    const navigate = useNavigate();
    const { openThread } = useThread();
    const { threads, isFetching, isFetchingNextPage, isError, hasMore, loadMore } = useGetThreads(workspaceId);

    const handleOpenThread = (thread) => {
        navigate(`/workspaces/${workspaceId}/channels/${thread.channelId}`);
        openThread(thread.threadId);
    };

    return (
        <div className="flex h-full flex-col bg-[#0a0a0a] text-slate-200">
            <div className="flex h-[56px] shrink-0 items-center gap-2.5 border-b border-white/5 px-5 pl-14 md:pl-5">
                <div className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-purple-400">
                    <MessageSquareTextIcon className="size-4" />
                </div>
                <h1 className="text-base font-semibold text-white">Threads</h1>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-6">
                {isFetching && threads.length === 0 && (
                    <div className="mx-auto flex max-w-2xl flex-col gap-3">
                        {[0, 1, 2].map((key) => (
                            <ThreadRowSkeleton key={key} />
                        ))}
                    </div>
                )}

                {isError && (
                    <EmptyState
                        icon={TriangleAlertIcon}
                        title="Could not load thread activity"
                        description="Something went wrong reaching the server. Try refreshing the page."
                    />
                )}

                {!isFetching && !isError && threads.length === 0 && (
                    <EmptyState
                        icon={MessageSquareTextIcon}
                        title="No thread activity yet"
                        description="Replies to your messages, threads you started, and mentions will show up here."
                    />
                )}

                {threads.length > 0 && (
                    <div className="mx-auto flex max-w-2xl flex-col gap-3">
                        {threads.map((thread) => (
                            <button
                                key={thread.threadId}
                                onClick={() => handleOpenThread(thread)}
                                className="group flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-left shadow-sm transition-all hover:border-purple-500/30 hover:bg-white/[0.07] hover:shadow-[0_0_20px_rgba(147,51,234,0.08)]"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                                        <HashIcon className="size-3.5" />
                                        {thread.channelName || 'channel'}
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <span className="text-[11px] text-slate-500">{formatTimestamp(thread.lastReplyAt)}</span>
                                        {thread.unreadCount > 0 && (
                                            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-purple-600 px-1.5 text-[10px] font-bold text-white">
                                                {thread.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <p className="line-clamp-1 text-sm font-medium text-white">
                                    {stripHtml(thread.rootMessage?.body) || 'View original message'}
                                </p>

                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <MessageSquareTextIcon className="size-3.5 shrink-0 text-slate-600" />
                                    <span className="shrink-0">
                                        {thread.replyCount} {thread.replyCount === 1 ? 'reply' : 'replies'}
                                    </span>
                                    {thread.lastReply?.senderId?.username && (
                                        <span className="truncate text-slate-500">
                                            · {thread.lastReply.senderId.username}: {stripHtml(thread.lastReply.body)}
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))}

                        {hasMore && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => loadMore()}
                                disabled={isFetchingNextPage}
                                className="mt-1 self-center border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"
                            >
                                {isFetchingNextPage ? 'Loading…' : 'Load more'}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
