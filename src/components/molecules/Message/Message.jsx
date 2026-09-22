import { SmilePlus, MessageSquareText, Pin, Trash, Edit, Star, PinOff, Sparkles, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { MessageImageThumbnail } from '@/components/atoms/MessageImageThumbnail/MessageImageThumbnail';
import { MessageRenderer } from '@/components/atoms/MessageRenderer/MessageRenderer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Hint } from '@/components/atoms/Hint/Hint';
import { useAuth } from '@/hooks/context/useAuth';
import { useCurrentWorkspace } from '@/hooks/context/useCurrentWorkspace';
import { Editor } from '@/components/atoms/Editor/Edtior';
import { getAvatarUrl } from '@/utils/getAvatarUrl';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useThread } from '@/context/ThreadContext';
import { useSocket } from '@/hooks/context/useSocket';

const COMMON_EMOJIS = ['👍', '❤️', '😂', '🔥', '👀'];

export const Message = ({
    messageId,
    author,
    authorId,
    authorImage,
    authorName = 'User',
    createdAt,
    body,
    image,
    reactions = [],
    onAddReaction,
    onToggleStar,
    onEdit,
    onDelete,
    onTogglePin,
    onRequestAiReply,
    showAiReplyAction = false,
    isReply = false,
    isEdited = false,
    isPending = false,
    deletedAt = null,
    isPinned = false,
    stars = []
}) => {
    const { openThread } = useThread();
    const { onlineUsers } = useSocket();
    const { auth } = useAuth();
    const { currentWorkspace } = useCurrentWorkspace();

    const [isEditing, setIsEditing] = useState(false);
    const [isFetchingAiReply, setIsFetchingAiReply] = useState(false);

    const isOnline = onlineUsers?.includes(authorId);
    const isAuthor = auth?.user?._id === authorId;

    const isWorkspaceAdmin = currentWorkspace?.members?.find(
        (m) => (m.memberId && m.memberId._id ? m.memberId._id === auth?.user?._id : m.memberId === auth?.user?._id) && m.role === 'admin'
    );
    const isStarred = stars?.includes(auth?.user?._id);

    const handleEditSubmit = async ({ body }) => {
        const success = await onEdit?.(messageId, body);
        if (success) setIsEditing(false);
    };
    const handleDelete = () => {
        onDelete?.(messageId);
    };
    const handleTogglePin = () => {
        onTogglePin?.(messageId);
    };
    const handleToggleStar = () => {
        onToggleStar?.(messageId);
    };
    const handleAiReply = async () => {
        if (!onRequestAiReply) return;

        setIsFetchingAiReply(true);
        try {
            await onRequestAiReply(messageId);
        } finally {
            setIsFetchingAiReply(false);
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return 'Just now';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; 

        const today = new Date();
        const isToday = date.getDate() === today.getDate() && 
                        date.getMonth() === today.getMonth() && 
                        date.getFullYear() === today.getFullYear();
        
        if (isToday) {
            return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' + date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        }
    };

    const reactionCounts = reactions.reduce((acc, current) => {
        const emoji = current.body;
        acc[emoji] = (acc[emoji] || 0) + 1;
        return acc;
    }, {});

    const displayTime = formatTime(createdAt);

    return (
        <div className={`flex w-full p-2 px-4 group relative mb-4 ${isAuthor ? 'justify-end' : 'justify-start'} ${isPending ? 'opacity-60' : ''}`}>
            
            {/* Hover Action Bar */}
            {!deletedAt && !isEditing && (
            <div className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1a1d24] border border-white/10 rounded-lg shadow-xl z-10 flex items-center ${isAuthor ? 'right-14' : 'left-14'}`}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="iconSm" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10">
                            <SmilePlus className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" className="flex flex-row p-1 gap-1 min-w-0 rounded-full bg-[#1a1d24] shadow-xl border-white/10">
                        {COMMON_EMOJIS.map((emoji) => (
                            <DropdownMenuItem 
                                key={emoji}
                                className="h-8 w-8 flex items-center justify-center text-lg cursor-pointer rounded-full hover:bg-white/10"
                                onClick={() => onAddReaction && onAddReaction(messageId, emoji)}
                            >
                                {emoji}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                {!isReply && (
                    <Hint label="Reply in thread">
                        <Button variant="ghost" size="iconSm" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10" onClick={() => openThread(messageId)}>
                            <MessageSquareText className="h-4 w-4" />
                        </Button>
                    </Hint>
                )}
                
                {isAuthor && (
                    <Hint label="Edit Message">
                        <Button variant="ghost" size="iconSm" onClick={() => setIsEditing(true)} className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10">
                            <Edit className="h-4 w-4" />
                        </Button>
                    </Hint>
                )}
                {(isAuthor || isWorkspaceAdmin) && (
                    <Hint label="Delete Message">
                        <Button variant="ghost" size="iconSm" onClick={handleDelete} className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10">
                            <Trash className="h-4 w-4" />
                        </Button>
                    </Hint>
                )}

                <Hint label={isPinned ? "Unpin Message" : "Pin Message"}>
                    <Button variant="ghost" size="iconSm" onClick={handleTogglePin} className={`h-8 w-8 hover:bg-white/10 ${isPinned ? 'text-purple-400' : 'text-slate-400 hover:text-white'}`}>
                        {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                    </Button>
                </Hint>

                <Hint label={isStarred ? "Unstar Message" : "Star Message"}>
                    <Button variant="ghost" size="iconSm" onClick={handleToggleStar} className={`h-8 w-8 hover:bg-white/10 ${isStarred ? 'text-amber-400' : 'text-slate-400 hover:text-white'}`}>
                        {isStarred ? <Star className="h-4 w-4 fill-amber-400" /> : <Star className="h-4 w-4" />}
                    </Button>
                </Hint>

                {showAiReplyAction && (
                    <Hint label="AI Auto Reply">
                        <Button 
                            variant="ghost" 
                            size="iconSm" 
                            onClick={handleAiReply} 
                            disabled={isFetchingAiReply}
                            className="h-8 w-8 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                        >
                            {isFetchingAiReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        </Button>
                    </Hint>
                )}
            </div>
            )}

            <div className={`flex items-end gap-3 max-w-[85%] md:max-w-[70%] ${isAuthor ? 'flex-row-reverse' : 'flex-row'}`}>
                
                {/* Avatar */}
                <button className="relative shrink-0 mb-1">
                    <Avatar className="w-10 h-10 border border-white/10 shadow-lg">
                        <AvatarImage className="rounded-full" src={getAvatarUrl(author || { profilePicture: authorImage })} />
                        <AvatarFallback className="rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
                            {authorName ? authorName.charAt(0).toUpperCase() : 'U'}
                        </AvatarFallback>
                    </Avatar>
                    {isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#0a0a0a] rounded-full z-10 box-content shadow-sm" />
                    )}
                </button>

                {/* Message Content Container */}
                <div className={`flex flex-col w-full ${isAuthor ? 'items-end' : 'items-start'}`}>
                    
                    {/* Header: Name and Time (Above the bubble) */}
                    <div className={`flex items-center gap-2 mb-1.5 px-1 ${isAuthor ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!isAuthor && <span className='text-sm font-semibold text-slate-300'>{authorName}</span>}
                        <span className='text-xs text-slate-500 font-medium'>{displayTime}</span>
                        {isEdited && !deletedAt && <span className="text-[10px] text-slate-500 italic">edited</span>}
                        {isPinned && !deletedAt && <Pin className="h-3 w-3 text-purple-400" />}
                        {isStarred && !deletedAt && <Star className="h-3 w-3 text-amber-400 fill-amber-400" />}
                    </div>

                    {/* Bubble */}
                    <div className={`
                        relative px-4 py-3 rounded-2xl text-[15px] leading-relaxed shadow-lg
                        ${isAuthor 
                            ? 'bg-purple-600 text-white rounded-br-sm shadow-[0_0_20px_rgba(147,51,234,0.15)]' 
                            : 'bg-[#1a1b23] text-slate-200 border border-white/5 rounded-bl-sm'
                        }
                    `}>
                        {deletedAt ? (
                            <div className="flex items-center gap-2 text-sm italic text-red-400/80">
                                <Trash className="h-4 w-4" /> Message deleted
                            </div>
                        ) : isEditing ? (
                            <div className="w-full min-w-[250px] bg-[#0a0a0a] border border-white/10 text-white rounded-lg p-2">
                                <Editor 
                                    variant="update"
                                    onSubmit={handleEditSubmit} 
                                    onCancel={() => setIsEditing(false)} 
                                    defaultValue={body} 
                                    workspaceMembers={currentWorkspace?.members} 
                                    workspaceChannels={currentWorkspace?.channels} 
                                />
                            </div>
                        ) : (
                            <>
                                {/* Ensure MessageRenderer inherits text color cleanly */}
                                <div className={`message-body-wrapper ${isAuthor ? 'text-white' : 'text-slate-200'}`}>
                                    <MessageRenderer value={body} />
                                </div>
                                {image && <div className="mt-3 rounded-lg overflow-hidden border border-white/10 shadow-lg"><MessageImageThumbnail url={image} /></div>}
                            </>
                        )}
                    </div>

                    {/* Reactions Display */}
                    {!deletedAt && Object.keys(reactionCounts).length > 0 && (
                        <div className={`flex flex-wrap items-center gap-1.5 mt-2 ${isAuthor ? 'justify-end' : 'justify-start'}`}>
                            {Object.entries(reactionCounts).map(([emoji, count]) => (
                                <button
                                    key={emoji}
                                    onClick={() => onAddReaction && onAddReaction(messageId, emoji)}
                                    className="h-7 px-2.5 flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 text-[12px] text-slate-300 font-medium hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                                >
                                    <span>{emoji}</span>
                                    <span>{count}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
