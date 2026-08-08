import assert from 'node:assert/strict';
import test from 'node:test';
import { describeDirectMessage } from '../src/web/admin/discord-dm-presentation.js';

test('presents known DM authors with safe Discord avatar URLs', () => {
  const result = describeDirectMessage({ type: 1, name: '', messages: [{ author: { id: '1', username: 'alice', globalName: 'Alice', avatar: 'abc' } }] });
  assert.equal(result.label, 'Alice');
  assert.equal(result.description, 'Direktnachricht mit Alice');
  assert.equal(result.participants[0].avatarUrl, 'https://cdn.discordapp.com/avatars/1/abc.png?size=64');
});

test('keeps a group name and deduplicates latest known authors', () => {
  const result = describeDirectMessage({ type: 3, name: 'Planung', messages: [{ author: { id: '1', username: 'alice', avatar: null } }, { author: { id: '1', username: 'alice', avatar: null } }, { author: { id: '2', username: 'bob', avatar: null } }] });
  assert.equal(result.label, 'Planung');
  assert.equal(result.description, 'Gruppen-DM · zuletzt geschrieben von alice, bob');
  assert.deepEqual(result.participants.map(({ name }) => name), ['alice', 'bob']);
});
