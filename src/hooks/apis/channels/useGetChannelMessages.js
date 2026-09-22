import { useInfiniteQuery } from '@tanstack/react-query';

import { getPaginatedMessages } from '@/apis/channels';
import { useAuth } from '@/hooks/context/useAuth';
import { flattenMessagePages, messagesQueryKey } from '@/lib/messageCache';

/**
 * Channel-scoped, cursor-paginated message history. Cache key is
 * ['messages', workspaceId, channelId] so messages from one channel can
 * never leak into another channel's view, and realtime updates can target
 * exactly this cache from anywhere (SocketContext) using the same key.
 */
export const useGetChannelMessages = (workspaceId, channelId) => {
    const { auth } = useAuth();

    const query = useInfiniteQuery({
        queryKey: messagesQueryKey(workspaceId, channelId),
        queryFn: ({ pageParam }) => getPaginatedMessages({
            channelId,
            cursor: pageParam,
            limit: 30,
            token: auth?.token
        }),
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => (lastPage?.hasMore ? lastPage.nextCursor : undefined),
        enabled: Boolean(channelId) && Boolean(workspaceId) && Boolean(auth?.token),
        staleTime: 10000
    });

    return {
        messages: flattenMessagePages(query.data),
        isFetching: query.isFetching,
        isFetchingNextPage: query.isFetchingNextPage,
        hasOlderMessages: Boolean(query.hasNextPage),
        loadOlderMessages: query.fetchNextPage,
        isError: query.isError,
        isSuccess: query.isSuccess,
        error: query.error
    };
};
