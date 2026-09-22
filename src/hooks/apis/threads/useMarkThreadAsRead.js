import { useMutation, useQueryClient } from '@tanstack/react-query';

import { markThreadAsReadRequest } from '@/api/threads';
import { useAuth } from '@/hooks/context/useAuth';

export const useMarkThreadAsRead = (workspaceId) => {
    const { auth } = useAuth();
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (threadId) => markThreadAsReadRequest({ workspaceId, threadId, token: auth?.token }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['threads', workspaceId] });
        }
    });

    return { markThreadAsRead: mutation.mutate };
};
