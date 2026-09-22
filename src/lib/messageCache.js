// Shared helpers for TanStack Query infinite-message caches (channel
// messages, direct messages, thread replies). Every cache using these
// helpers must store data shaped as `{ pages: [{ items, nextCursor,
// hasMore }, ...] }`, with `pages[0]` holding the newest batch and each
// page's `items` sorted newest-first — exactly what the cursor-pagination
// endpoints return.

export const messagesQueryKey = (workspaceId, channelId) => ['messages', workspaceId, channelId];

export const directMessagesQueryKey = (workspaceId, memberId) => ['directMessages', workspaceId, memberId];

export const threadMessagesQueryKey = (threadId) => ['threadMessages', threadId];

export const createClientId = () =>
  `temp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

/**
 * Flattens paginated pages into a single oldest-to-newest array, ready to
 * render top-to-bottom in a chat view.
 */
export const flattenMessagePages = (data) => {
  if (!data?.pages) return [];
  return [...data.pages].reverse().flatMap((page) => [...(page.items || [])].reverse());
};

/**
 * Idempotently inserts or replaces a message by id. A message matches an
 * existing cache entry if either its real `_id` or its `clientId` (the id an
 * optimistic entry was created with) is already present — this is what lets
 * the optimistic bubble, the socket broadcast, and the ack callback for the
 * same send all converge on a single entry regardless of arrival order.
 */
export const upsertMessage = (queryClient, queryKey, message) => {
  if (!message?._id) return;

  queryClient.setQueryData(queryKey, (data) => {
    if (!data?.pages) return data;

    const matchIds = new Set([message._id, message.clientId].filter(Boolean));
    let found = false;

    const pages = data.pages.map((page) => {
      let changed = false;
      const items = (page.items || []).map((item) => {
        if (matchIds.has(item._id)) {
          found = true;
          changed = true;
          return message;
        }
        return item;
      });
      return changed ? { ...page, items } : page;
    });

    if (found) {
      return { ...data, pages };
    }

    const [firstPage, ...rest] = data.pages;
    const newFirstPage = firstPage
      ? { ...firstPage, items: [message, ...(firstPage.items || [])] }
      : { items: [message], nextCursor: null, hasMore: false };

    return { ...data, pages: [newFirstPage, ...rest] };
  });
};

/**
 * Patches an existing message in place (used for optimistic edit/reaction/
 * star/delete). Returns a snapshot of the previous value so the caller can
 * roll back on server rejection; returns null if the message was not found
 * in the cache (e.g. an older page that has not been loaded yet).
 */
export const patchMessage = (queryClient, queryKey, messageId, patchFn) => {
  let previous = null;

  queryClient.setQueryData(queryKey, (data) => {
    if (!data?.pages) return data;

    const pages = data.pages.map((page) => {
      const index = (page.items || []).findIndex((item) => item._id === messageId);
      if (index === -1) return page;

      previous = page.items[index];
      const items = [...page.items];
      items[index] = patchFn(items[index]);
      return { ...page, items };
    });

    return { ...data, pages };
  });

  return previous;
};

/**
 * Thread caches are shaped as `{ rootMessage, replies }`, not the paginated
 * `{ pages }` shape — the root message and its replies both need patching
 * (an action can target either), so these mirror patchMessage/upsertMessage
 * for that shape instead of reusing the paginated helpers.
 */
export const patchThreadMessage = (queryClient, threadId, messageId, patchFn) => {
  let previous = null;

  queryClient.setQueryData(threadMessagesQueryKey(threadId), (existing) => {
    if (!existing) return existing;

    if (existing.rootMessage?._id === messageId) {
      previous = existing.rootMessage;
      return { ...existing, rootMessage: patchFn(existing.rootMessage) };
    }

    const index = (existing.replies || []).findIndex((reply) => reply._id === messageId);
    if (index === -1) return existing;

    previous = existing.replies[index];
    const replies = [...existing.replies];
    replies[index] = patchFn(replies[index]);
    return { ...existing, replies };
  });

  return previous;
};

export const applyThreadMessage = (queryClient, threadId, updatedMessage) => {
  queryClient.setQueryData(threadMessagesQueryKey(threadId), (existing) => {
    if (!existing || !updatedMessage?._id) return existing;

    if (existing.rootMessage?._id === updatedMessage._id) {
      return { ...existing, rootMessage: updatedMessage };
    }

    const index = (existing.replies || []).findIndex((reply) => reply._id === updatedMessage._id);
    if (index === -1) return existing;

    const replies = [...existing.replies];
    replies[index] = updatedMessage;
    return { ...existing, replies };
  });
};

export const removeMessageById = (queryClient, queryKey, messageId) => {
  queryClient.setQueryData(queryKey, (data) => {
    if (!data?.pages) return data;

    const pages = data.pages.map((page) => ({
      ...page,
      items: (page.items || []).filter((item) => item._id !== messageId)
    }));

    return { ...data, pages };
  });
};
