import { HashIcon, SendHorizonalIcon, TriangleAlertIcon, UserIcon } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { EmptyState } from '@/components/atoms/EmptyState/EmptyState';
import { useDrafts } from '@/hooks/apis/drafts/useDrafts';

const stripHtml = (value) => {
    if (!value) return '';
    try {
        const parsed = JSON.parse(value);
        const ops = Array.isArray(parsed) ? parsed : parsed?.ops;
        if (Array.isArray(ops)) {
            return ops.map((op) => (typeof op.insert === 'string' ? op.insert : '')).join('').trim();
        }
    } catch {
        // not a Quill delta — fall through to plain-text handling
    }
    return value.replace(/<[^>]*>?/gm, '');
};

const formatTimestamp = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const DraftRowSkeleton = () => (
    <div className="animate-pulse rounded-2xl border border-white/5 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-2">
            <div className="h-3 w-24 rounded-full bg-white/10" />
            <div className="h-3 w-14 rounded-full bg-white/10" />
        </div>
        <div className="mt-3 h-4 w-2/3 rounded-full bg-white/10" />
    </div>
);

export const Drafts = () => {
    const { workspaceId } = useParams();
    const navigate = useNavigate();
    const { drafts, isFetching, isError } = useDrafts(workspaceId);

    const handleOpenDraft = (draft) => {
        if (draft.channelId) {
            navigate(`/workspaces/${workspaceId}/channels/${draft.channelId}`);
        } else if (draft.recipientId) {
            navigate(`/workspaces/${workspaceId}/members/${draft.recipientId}`);
        }
    };

    return (
        <div className="flex h-full flex-col bg-[#0a0a0a] text-slate-200">
            <div className="flex h-[56px] shrink-0 items-center gap-2.5 border-b border-white/5 px-5 pl-14 md:pl-5">
                <div className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-purple-400">
                    <SendHorizonalIcon className="size-4" />
                </div>
                <h1 className="text-base font-semibold text-white">Drafts &amp; Sends</h1>
                {drafts.length > 0 && (
                    <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/10 px-1.5 text-[11px] font-semibold text-slate-300">
                        {drafts.length}
                    </span>
                )}
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-6">
                {isFetching && drafts.length === 0 && (
                    <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
                        {[0, 1].map((key) => (
                            <DraftRowSkeleton key={key} />
                        ))}
                    </div>
                )}

                {isError && (
                    <EmptyState
                        icon={TriangleAlertIcon}
                        title="Could not load drafts"
                        description="Something went wrong reaching the server. Try refreshing the page."
                    />
                )}

                {!isFetching && !isError && drafts.length === 0 && (
                    <EmptyState
                        icon={SendHorizonalIcon}
                        title="No saved drafts"
                        description="Anything you start typing in a channel or a direct message is saved here automatically, so you never lose an unfinished thought."
                    />
                )}

                {drafts.length > 0 && (
                    <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
                        {drafts.map((draft) => (
                            <button
                                key={draft._id}
                                onClick={() => handleOpenDraft(draft)}
                                className="group flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-left shadow-sm transition-all hover:border-purple-500/30 hover:bg-white/[0.07] hover:shadow-[0_0_20px_rgba(147,51,234,0.08)]"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                                        {draft.channelId ? (
                                            <HashIcon className="size-3.5" />
                                        ) : (
                                            <UserIcon className="size-3.5" />
                                        )}
                                        {draft.channelName || draft.recipient?.username || 'Conversation'}
                                    </div>
                                    <span className="shrink-0 text-[11px] text-slate-500">
                                        {formatTimestamp(draft.updatedAt)}
                                    </span>
                                </div>
                                <p className="line-clamp-2 text-sm text-slate-300">
                                    {stripHtml(draft.body) || 'Empty draft'}
                                </p>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
