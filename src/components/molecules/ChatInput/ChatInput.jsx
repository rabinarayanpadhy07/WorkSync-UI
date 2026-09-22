import { useRef } from 'react';

import { Editor } from '@/components/atoms/Editor/Edtior';
import { useAuth } from '@/hooks/context/useAuth';
import { useComposerDraft } from '@/hooks/apis/drafts/useComposerDraft';
import { useCurrentWorkspace } from '@/hooks/context/useCurrentWorkspace';
import { useSocket } from '@/hooks/context/useSocket';

/**
 * Generic message composer. The caller always owns what happens on submit
 * (channel send, DM send, thread reply each have different optimistic/cache
 * behavior) — this component only renders the editor, drives the typing
 * indicator, and — when `draftScope` is provided — loads/saves a draft for
 * whichever channel or DM this composer instance represents.
 */
export const ChatInput = ({ onSubmit, seedValue, draftScope }) => {

    const { socket, currentChannel } = useSocket();
    const { auth } = useAuth();
    const { currentWorkspace } = useCurrentWorkspace();
    const typingTimeoutRef = useRef(null);

    const { draftBody, scheduleSave, clearDraft } = useComposerDraft(draftScope || {});

    function handleTextChange(contentJson) {
        if (socket && currentChannel && auth?.user?.username) {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            } else {
                socket.emit('typing_start', {
                    channelId: currentChannel,
                    username: auth.user.username
                });
            }

            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('typing_stop', {
                    channelId: currentChannel,
                    username: auth.user.username
                });
                typingTimeoutRef.current = null;
            }, 2000);
        }

        if (draftScope) {
            scheduleSave(contentJson);
        }
    }

    async function handleSubmit(payload) {
        await onSubmit(payload);
        if (draftScope) {
            clearDraft();
        }
    }

    return (
        <div
            className="px-5 w-full"
        >
            <Editor
                placeholder="Type a message..."
                onSubmit={handleSubmit}
                onTextChange={handleTextChange}
                onCancel={() => {}}
                disabled={false}
                defaultValue=""
                seedValue={seedValue || draftBody}
                workspaceMembers={currentWorkspace?.members || []}
                workspaceChannels={currentWorkspace?.channels || []}
            />


        </div>
    );
};
