import { useQuery } from '@tanstack/react-query';

import { getDraftsRequest } from '@/apis/drafts';
import { useAuth } from '@/hooks/context/useAuth';

export const useDrafts = (workspaceId) => {
    const { auth } = useAuth();

    const { data, isFetching, isError, error } = useQuery({
        queryKey: ['drafts', workspaceId],
        queryFn: () => getDraftsRequest({ workspaceId, token: auth?.token }),
        enabled: Boolean(workspaceId) && Boolean(auth?.token),
        staleTime: 30000
    });

    return {
        drafts: data || [],
        isFetching,
        isError,
        error
    };
};
