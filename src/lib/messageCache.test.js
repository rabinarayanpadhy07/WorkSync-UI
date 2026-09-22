import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it } from 'vitest';

import {
    flattenMessagePages,
    messagesQueryKey,
    patchMessage,
    removeMessageById,
    upsertMessage
} from './messageCache';

const seedData = (items) => ({
    pages: [{ items, nextCursor: null, hasMore: false }],
    pageParams: [undefined]
});

let queryClient;

beforeEach(() => {
    queryClient = new QueryClient();
});

describe('upsertMessage', () => {
    it('prepends a genuinely new message to the newest page', () => {
        const key = messagesQueryKey('ws-1', 'chan-1');
        queryClient.setQueryData(key, seedData([{ _id: 'm1', body: 'hi' }]));

        upsertMessage(queryClient, key, { _id: 'm2', body: 'new' });

        const data = queryClient.getQueryData(key);
        expect(data.pages[0].items.map((m) => m._id)).toEqual(['m2', 'm1']);
    });

    it('replaces an existing message in place by _id (no duplicate, no reorder)', () => {
        const key = messagesQueryKey('ws-1', 'chan-1');
        queryClient.setQueryData(key, seedData([
            { _id: 'm2', body: 'new' },
            { _id: 'm1', body: 'hi' }
        ]));

        upsertMessage(queryClient, key, { _id: 'm1', body: 'edited' });

        const data = queryClient.getQueryData(key);
        expect(data.pages[0].items).toHaveLength(2);
        expect(data.pages[0].items[1]).toMatchObject({ _id: 'm1', body: 'edited' });
    });

    it('reconciles an optimistic entry by clientId regardless of arrival order', () => {
        const key = messagesQueryKey('ws-1', 'chan-1');
        // Optimistic bubble inserted with a temporary id.
        queryClient.setQueryData(key, seedData([{ _id: 'temp-abc', clientId: 'temp-abc', body: 'sending', isPending: true }]));

        // The real message arrives (e.g. via the room broadcast) carrying the
        // same clientId but a server-assigned real _id.
        upsertMessage(queryClient, key, { _id: 'real-1', clientId: 'temp-abc', body: 'sending' });

        let data = queryClient.getQueryData(key);
        expect(data.pages[0].items).toHaveLength(1);
        expect(data.pages[0].items[0]._id).toBe('real-1');

        // The ack callback for the same send arrives afterwards with the
        // same real message — must not create a second entry.
        upsertMessage(queryClient, key, { _id: 'real-1', clientId: 'temp-abc', body: 'sending' });
        data = queryClient.getQueryData(key);
        expect(data.pages[0].items).toHaveLength(1);
    });

    it('never leaks a message into a different channel or workspace cache', () => {
        const channelAKey = messagesQueryKey('ws-1', 'chan-engineering');
        const channelBKey = messagesQueryKey('ws-1', 'chan-general');
        queryClient.setQueryData(channelAKey, seedData([]));
        queryClient.setQueryData(channelBKey, seedData([{ _id: 'existing', body: 'general chat' }]));

        upsertMessage(queryClient, channelAKey, { _id: 'm1', channelId: 'chan-engineering', body: 'engineering only' });

        const channelAData = queryClient.getQueryData(channelAKey);
        const channelBData = queryClient.getQueryData(channelBKey);
        expect(channelAData.pages[0].items).toHaveLength(1);
        expect(channelBData.pages[0].items).toHaveLength(1);
        expect(channelBData.pages[0].items[0]._id).toBe('existing');
    });

    it('is a no-op when the cache does not exist yet (channel never opened this session)', () => {
        const key = messagesQueryKey('ws-1', 'chan-never-opened');
        upsertMessage(queryClient, key, { _id: 'm1', body: 'hi' });
        expect(queryClient.getQueryData(key)).toBeUndefined();
    });
});

describe('patchMessage', () => {
    it('applies a patch and returns the previous value for rollback', () => {
        const key = messagesQueryKey('ws-1', 'chan-1');
        queryClient.setQueryData(key, seedData([{ _id: 'm1', body: 'original', reactions: [] }]));

        const previous = patchMessage(queryClient, key, 'm1', (msg) => ({ ...msg, body: 'patched' }));

        expect(previous).toMatchObject({ body: 'original' });
        expect(queryClient.getQueryData(key).pages[0].items[0].body).toBe('patched');
    });

    it('returns null and leaves the cache untouched when the message is not loaded', () => {
        const key = messagesQueryKey('ws-1', 'chan-1');
        queryClient.setQueryData(key, seedData([{ _id: 'm1', body: 'original' }]));

        const previous = patchMessage(queryClient, key, 'not-loaded', (msg) => msg);

        expect(previous).toBeNull();
        expect(queryClient.getQueryData(key).pages[0].items).toHaveLength(1);
    });
});

describe('removeMessageById', () => {
    it('removes only the targeted message', () => {
        const key = messagesQueryKey('ws-1', 'chan-1');
        queryClient.setQueryData(key, seedData([{ _id: 'm1' }, { _id: 'm2' }]));

        removeMessageById(queryClient, key, 'm1');

        const items = queryClient.getQueryData(key).pages[0].items;
        expect(items).toHaveLength(1);
        expect(items[0]._id).toBe('m2');
    });
});

describe('flattenMessagePages', () => {
    it('orders oldest-to-newest across pages (pages[0] is the newest batch)', () => {
        const data = {
            pages: [
                { items: [{ _id: 'm4' }, { _id: 'm3' }] }, // newest batch, desc order
                { items: [{ _id: 'm2' }, { _id: 'm1' }] }  // older batch, desc order
            ]
        };

        expect(flattenMessagePages(data).map((m) => m._id)).toEqual(['m1', 'm2', 'm3', 'm4']);
    });

    it('returns an empty array for missing data', () => {
        expect(flattenMessagePages(undefined)).toEqual([]);
    });
});
