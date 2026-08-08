import assert from 'node:assert/strict';
import test from 'node:test';
import { pageResult, parseDetailPage } from '../src/web/admin/discord-detail-pagination.js';

test('bounds detail page size and accepts only Discord-ID cursors', () => {
  assert.deepEqual(parseDetailPage({}), { limit: 50, cursor: null });
  assert.deepEqual(parseDetailPage({ limit: '1000', cursor: '123456789012345678' }), { limit: 100, cursor: '123456789012345678' });
  assert.deepEqual(parseDetailPage({ limit: '-4', cursor: 'not-a-discord-id' }), { limit: 1, cursor: null });
});

test('keeps one extra record solely to produce a stable next cursor', () => {
  assert.deepEqual(pageResult([{ id: '1' }, { id: '2' }, { id: '3' }], 2), { items: [{ id: '1' }, { id: '2' }], nextCursor: '2' });
  assert.deepEqual(pageResult([{ userId: '1' }, { userId: '2' }], 2, 'userId'), { items: [{ userId: '1' }, { userId: '2' }], nextCursor: null });
});
