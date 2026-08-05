import assert from 'node:assert/strict';
import test from 'node:test';
import { EventEmitter } from 'node:events';
import { attachDiscordEventHandlers, normalizeDiscordMessageContent } from '../src/discord-adapter/discord-event-handler.js';

function fakeRepository() {
  const calls = [];
  return {
    calls,
    upsertGuild: async (value) => calls.push(['guild', value]),
    upsertUser: async (value) => calls.push(['user', value]),
    upsertChannel: async (value) => calls.push(['channel', value]),
    saveMessage: async (value) => calls.push(['message', value]),
  };
}

test('persists an inbound direct message without inventing a guild record', async () => {
  const client = new EventEmitter();
  const repository = fakeRepository();
  attachDiscordEventHandlers({ client, dataRepository: repository, settings: { listenMessages: true }, logger: { error: () => {} } });

  client.emit('messageCreate', {
    id: 'dm-message-1', guild: null,
    channel: { id: 'dm-channel-1', name: null, type: 1, topic: null, rawPosition: 0, parentId: null },
    author: { id: 'user-1', username: 'Sascha', discriminator: '0', globalName: 'Sascha', avatar: null, bot: false },
    content: 'Private hello', createdAt: new Date('2026-08-05T12:00:00Z'),
  });
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(repository.calls.map(([type]) => type), ['user', 'channel', 'message']);
  assert.equal(repository.calls[1][1].guildId, null);
  assert.equal(repository.calls[2][1].guildId, null);
});

test('persists a received bot-authored message when message listening is enabled', async () => {
  const client = new EventEmitter();
  const repository = fakeRepository();
  attachDiscordEventHandlers({ client, dataRepository: repository, settings: { listenMessages: true }, logger: { error: () => {} } });
  const guild = { id: 'guild-1', name: 'Test guild', icon: null, ownerId: 'owner-1' };

  client.emit('messageCreate', {
    id: 'bot-message-1', guild,
    channel: { id: 'channel-1', guildId: 'guild-1', name: 'general', type: 0, topic: null, rawPosition: 0, parentId: null },
    author: { id: 'bot-1', username: 'Notifier', discriminator: '0', globalName: 'Notifier', avatar: null, bot: true },
    content: 'Automated notice', createdAt: new Date('2026-08-05T12:01:00Z'),
  });
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(repository.calls.map(([type]) => type), ['guild', 'user', 'channel', 'message']);
  assert.equal(repository.calls[3][1].authorId, 'bot-1');
});

test('normalizes inbound Unicode emoji to the legacy storage representation', () => {
  assert.equal(normalizeDiscordMessageContent('Hello 😄'), 'Hello :smile:');
});
