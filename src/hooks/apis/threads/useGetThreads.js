import { useInfiniteQuery } from '@tanstack/react-query';

import { getThreadsRequest } from '@/api/threads';
import { useAuth } from '@/hooks/context/useAuth';

export const useGetThreads = (workspaceId) => {
    const { auth } = useAuth();

    const query = useInfiniteQuery({
        queryKey: ['threads', workspaceId],
        queryFn: ({ pageParam }) => getThreadsRequest({
            workspaceId,
            cursor: pageParam,
            limit: 20,
            token: auth?.token
        }),
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => (lastPage?.hasMore ? lastPage.nextCursor : undefined),
        enabled: Boolean(workspaceId) && Boolean(auth?.token),
        staleTime: 10000
    });

    const threads = (query.data?.pages || []).flatMap((page) => page.items || []);

    return {
        threads,
        isFetching: query.isFetching,
        isFetchingNextPage: query.isFetchingNextPage,
        hasMore: Boolean(query.hasNextPage),
        loadMore: query.fetchNextPage,
        isError: query.isError,
        error: query.error
    };
};
