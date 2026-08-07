import assert from 'node:assert/strict';
import test from 'node:test';
import { describeDiscordChannel, sortDiscordGuildChannels } from '../src/web/admin/discord-channel-presentation.js';

test('describes Discord channel types with a readable label and icon', () => {
  assert.deepEqual(describeDiscordChannel({ type: 0 }), { icon: '#', label: 'Textkanal', isThread: false });
  assert.deepEqual(describeDiscordChannel({ type: 11 }), { icon: '↳', label: 'Öffentlicher Thread', isThread: true });
});

test('orders categories with their channels and places threads directly after their parent channel', () => {
  const ordered = sortDiscordGuildChannels([
    { id: 'thread-1', name: 'discussion', type: 11, position: 0, parentId: 'text-1' },
    { id: 'root-1', name: 'welcome', type: 0, position: 2, parentId: null },
    { id: 'text-1', name: 'general', type: 0, position: 1, parentId: 'category-1' },
    { id: 'category-1', name: 'Community', type: 4, position: 1, parentId: null },
  ]);

  assert.deepEqual(ordered.map(({ id, depth, parentName }) => ({ id, depth, parentName })), [
    { id: 'category-1', depth: 0, parentName: null },
    { id: 'text-1', depth: 1, parentName: 'Community' },
    { id: 'thread-1', depth: 2, parentName: 'general' },
    { id: 'root-1', depth: 0, parentName: null },
  ]);
});
