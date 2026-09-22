import { useCallback, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
    deleteChannelDraftRequest,
    deleteDmDraftRequest,
    getChannelDraftRequest,
    getDmDraftRequest,
    upsertChannelDraftRequest,
    upsertDmDraftRequest
} from '@/apis/drafts';
import { useAuth } from '@/hooks/context/useAuth';

const DRAFT_SAVE_DEBOUNCE_MS = 700;

/**
 * Loads and persists a single composer's draft (either a channel composer or
 * a DM composer — pass exactly one of `channelId` / `memberId`). Saves are
 * debounced so we never write on every keystroke.
 */
export const useComposerDraft = ({ workspaceId, channelId, memberId }) => {
    const { auth } = useAuth();
    const queryClient = useQueryClient();
    const isDm = Boolean(memberId);
    const targetId = isDm ? memberId : channelId;
    const enabled = Boolean(workspaceId) && Boolean(targetId) && Boolean(auth?.token);
    const queryKey = ['draft', workspaceId, isDm ? 'dm' : 'channel', targetId];

    const { data: draft, isSuccess } = useQuery({
        queryKey,
        queryFn: () => (isDm
            ? getDmDraftRequest({ workspaceId, memberId, token: auth?.token })
            : getChannelDraftRequest({ workspaceId, channelId, token: auth?.token })),
        enabled,
        staleTime: 30000
    });

    const saveMutation = useMutation({
        mutationFn: (body) => (isDm
            ? upsertDmDraftRequest({ workspaceId, memberId, body, token: auth?.token })
            : upsertChannelDraftRequest({ workspaceId, channelId, body, token: auth?.token })),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['drafts', workspaceId] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: () => (isDm
            ? deleteDmDraftRequest({ workspaceId, memberId, token: auth?.token })
            : deleteChannelDraftRequest({ workspaceId, channelId, token: auth?.token })),
        onSuccess: () => {
            queryClient.setQueryData(queryKey, null);
            queryClient.invalidateQueries({ queryKey: ['drafts', workspaceId] });
        }
    });

    const debounceTimerRef = useRef(null);
    useEffect(() => () => clearTimeout(debounceTimerRef.current), []);

    const scheduleSave = useCallback((body) => {
        if (!enabled) return;
        clearTimeout(debounceTimerRef.current);

        if (!body || !body.trim()) {
            debounceTimerRef.current = setTimeout(() => deleteMutation.mutate(), DRAFT_SAVE_DEBOUNCE_MS);
            return;
        }

        debounceTimerRef.current = setTimeout(() => saveMutation.mutate(body), DRAFT_SAVE_DEBOUNCE_MS);
    }, [enabled, saveMutation, deleteMutation]);

    const clearDraft = useCallback(() => {
        clearTimeout(debounceTimerRef.current);
        queryClient.setQueryData(queryKey, null);
        deleteMutation.mutate();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- queryKey is derived from these
    }, [queryClient, deleteMutation, workspaceId, isDm, targetId]);

    return {
        draftBody: isSuccess ? draft?.body : undefined,
        scheduleSave,
        clearDraft
    };
};
