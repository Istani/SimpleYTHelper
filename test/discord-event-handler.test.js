import assert from 'node:assert/strict';
import test from 'node:test';
import { EventEmitter } from 'node:events';
import { attachDiscordEventHandlers } from '../src/discord-adapter/discord-event-handler.js';

function fakeRepository() {
  const calls = [];
  return {
    calls,
    upsertGuild: async (value) => calls.push(['guild', value]),
    upsertUser: async (value) => calls.push(['user', value]),
    upsertChannel: async (value) => calls.push(['channel', value]),
    saveMessage: async (value) => calls.push(['message', value]),
    bulkUpsertChannels: async (value) => calls.push(['channels', value]),
    bulkUpsertRoles: async (value) => calls.push(['roles', value]),
  };
}

const guild = {
  id: 'guild-1', name: 'Test guild', icon: null, ownerId: 'owner-1',
  channels: { cache: new Map([['channel-1', { id: 'channel-1', guildId: 'guild-1', name: 'general', type: 0, topic: null, rawPosition: 2, parentId: null }]]) },
  roles: { cache: new Map([['role-1', { id: 'role-1', name: 'Member', color: 0, hoist: false, position: 1, permissions: { bitfield: 1024n }, managed: false, mentionable: false }]]) },
};

test('persists a received guild message with its dependencies when message listening is enabled', async () => {
  const client = new EventEmitter();
  const repository = fakeRepository();
  attachDiscordEventHandlers({ client, dataRepository: repository, settings: { listenMessages: true }, logger: { error: () => {} } });

  client.emit('messageCreate', {
    id: 'message-1', guild, channel: guild.channels.cache.get('channel-1'),
    author: { id: 'user-1', username: 'Sascha', discriminator: '0', globalName: 'Sascha', avatar: null, bot: false },
    content: 'Hallo Discord', createdAt: new Date('2026-08-05T12:00:00Z'),
  });
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(repository.calls.map(([type]) => type), ['guild', 'user', 'channel', 'message']);
  assert.equal(repository.calls[3][1].content, 'Hallo Discord');
});

test('syncs guild channels and roles on guildCreate', async () => {
  const client = new EventEmitter();
  const repository = fakeRepository();
  attachDiscordEventHandlers({ client, dataRepository: repository, logger: { error: () => {} } });

  client.emit('guildCreate', guild);
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(repository.calls.map(([type]) => type), ['guild', 'channels', 'roles']);
  assert.equal(repository.calls[1][1][0].id, 'channel-1');
  assert.equal(repository.calls[2][1][0].permissions, 1024n);
});

test('syncs cached guilds on the Discord.js clientReady event', async () => {
  const client = new EventEmitter();
  client.guilds = { cache: new Map([[guild.id, guild]]) };
  const repository = fakeRepository();
  attachDiscordEventHandlers({ client, dataRepository: repository, logger: { error: () => {} } });

  client.emit('clientReady');
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(repository.calls.map(([type]) => type), ['guild', 'channels', 'roles']);
});
