import { useQuery } from '@tanstack/react-query';

import { getThreadMessagesRequest } from '@/api/threads';
import { useAuth } from '@/hooks/context/useAuth';
import { threadMessagesQueryKey } from '@/lib/messageCache';

export const useGetThreadMessages = ({ workspaceId, threadId }) => {
    const { auth } = useAuth();

    const {
        data,
        isSuccess,
        isError,
        isFetching,
        error
    } = useQuery({
        queryFn: () => getThreadMessagesRequest({
            workspaceId,
            threadId,
            token: auth?.token
        }),
        queryKey: threadMessagesQueryKey(threadId),
        staleTime: 10000,
        enabled: !!threadId && !!workspaceId && !!auth?.token,
    });

    return {
        rootMessage: data?.rootMessage,
        messages: data?.replies || [],
        isSuccess,
        isError,
        isFetching,
        error
    };
};
