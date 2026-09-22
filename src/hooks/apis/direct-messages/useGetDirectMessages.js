import { useInfiniteQuery } from '@tanstack/react-query';

import axiosInstance from '@/config/axiosConfig';
import { useAuth } from '@/hooks/context/useAuth';
import { directMessagesQueryKey, flattenMessagePages } from '@/lib/messageCache';

const EMPTY_PAGE = { items: [], nextCursor: null, hasMore: false };

// NOTE: This hook assumes backend envelope { data, message } for responses.
export const useGetDirectMessages = ({ workspaceId, memberId }) => {
    const { auth } = useAuth();
    const enabled = Boolean(workspaceId && memberId && auth?.token);

    const query = useInfiniteQuery({
        queryKey: directMessagesQueryKey(workspaceId, memberId),
        enabled,
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => (lastPage?.hasMore ? lastPage.nextCursor : undefined),
        queryFn: async ({ pageParam }) => {
            try {
                const res = await axiosInstance.get(
                    `/workspaces/${workspaceId}/members/${memberId}/messages`,
                    {
                        params: { cursor: pageParam, limit: 30 },
                        headers: { 'x-access-token': auth?.token }
                    }
                );
                return res?.data?.data || EMPTY_PAGE;
            } catch (error) {
                if (error?.response?.status === 404) {
                    return EMPTY_PAGE;
                }
                throw error;
            }
        },
        retry: (failureCount, error) => {
            if (error?.response?.status === 404) return false;
            return failureCount < 3;
        }
    });

    return {
        messages: flattenMessagePages(query.data),
        isFetching: query.isFetching,
        isFetchingNextPage: query.isFetchingNextPage,
        hasOlderMessages: Boolean(query.hasNextPage),
        loadOlderMessages: query.fetchNextPage,
        isError: query.isError,
        error: query.error
    };
};
