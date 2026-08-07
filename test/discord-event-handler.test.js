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
    replaceGuildChannels: async (value) => calls.push(['channels', value]),
    replaceGuildRoles: async (value) => calls.push(['roles', value]),
    upsertRole: async (value) => calls.push(['role', value]),
    upsertGuildMember: async (value) => calls.push(['member', value]),
    replaceGuildMembers: async (value) => calls.push(['members', value]),
    recordGuildFullSync: async (value) => calls.push(['guildFullSync', value]),
    recordGuildFullSyncFailure: async (value) => calls.push(['guildFullSyncFailure', value]),
    deleteGuild: async (guildId) => calls.push(['deleteGuild', guildId]),
    deleteChannel: async (channelId) => calls.push(['deleteChannel', channelId]),
    deleteRole: async (roleId) => calls.push(['deleteRole', roleId]),
    removeGuildMember: async (value) => calls.push(['removeMember', value]),
    replaceGuildMemberRoles: async (value) => calls.push(['replaceMemberRoles', value]),
  };
}

const guild = {
  id: 'guild-1', name: 'Test guild', icon: null, ownerId: 'owner-1',
  channels: { cache: new Map([['channel-1', { id: 'channel-1', guildId: 'guild-1', name: 'general', type: 0, topic: null, rawPosition: 2, parentId: null }]]) },
  roles: { cache: new Map([['role-1', { id: 'role-1', name: 'Member', color: 0, hoist: false, position: 1, permissions: { bitfield: 1024n }, managed: false, mentionable: false }]]) },
  members: { fetch: async () => new Map([['user-1', { user: { id: 'user-1', username: 'Sascha', discriminator: '0', globalName: 'Sascha', avatar: null, bot: false }, nickname: 'Boss', joinedAt: new Date('2026-08-01T12:00:00Z'), roles: { cache: new Map([['role-1', { id: 'role-1' }]]) } }]]) },
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

test('projects attachments, embeds and stickers as ordered structured message media', async () => {
  const client = new EventEmitter();
  const repository = fakeRepository();
  attachDiscordEventHandlers({ client, dataRepository: repository, settings: { listenMessages: true }, logger: { error: () => {} } });

  client.emit('messageCreate', {
    id: 'message-media-1', guild, channel: guild.channels.cache.get('channel-1'),
    author: { id: 'user-1', username: 'Sascha', discriminator: '0', globalName: 'Sascha', avatar: null, bot: false },
    content: 'Mit Medien', createdAt: new Date('2026-08-06T11:00:00Z'),
    attachments: new Map([['attachment-1', { id: 'attachment-1', name: 'diagram.png', url: 'https://cdn.discordapp.com/attachments/1/diagram.png', contentType: 'image/png', size: 1234, width: 640, height: 480, description: 'Architekturdiagramm', spoiler: false }]]),
    embeds: [{ title: 'Release notes', url: 'https://example.test/release-notes', type: 'article' }],
    stickers: new Map([['sticker-1', { id: 'sticker-1', name: 'Daumen hoch', url: 'https://cdn.discordapp.com/stickers/sticker-1.png', format: 1 }]]),
  });
  await new Promise((resolve) => setImmediate(resolve));

  const message = repository.calls.find(([type]) => type === 'message')[1];
  assert.deepEqual(message.media, [
    { kind: 'attachment', position: 0, sourceId: 'attachment-1', label: 'diagram.png', url: 'https://cdn.discordapp.com/attachments/1/diagram.png', contentType: 'image/png', sizeBytes: 1234, width: 640, height: 480, description: 'Architekturdiagramm', isSpoiler: false },
    { kind: 'embed', position: 0, sourceId: null, label: 'Release notes', url: 'https://example.test/release-notes', contentType: null, sizeBytes: null, width: null, height: null, description: null, isSpoiler: false },
    { kind: 'sticker', position: 0, sourceId: 'sticker-1', label: 'Daumen hoch', url: 'https://cdn.discordapp.com/stickers/sticker-1.png', contentType: null, sizeBytes: null, width: null, height: null, description: null, isSpoiler: false },
  ]);
});

test('syncs guild channels and roles on guildCreate', async () => {
  const client = new EventEmitter();
  const repository = fakeRepository();
  attachDiscordEventHandlers({ client, dataRepository: repository, logger: { error: () => {} } });

  client.emit('guildCreate', guild);
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(repository.calls.map(([type]) => type), ['guild', 'channels', 'roles', 'user', 'members', 'guildFullSync']);
  assert.deepEqual(repository.calls[4][1], {
    guildId: 'guild-1',
    members: [{ guildId: 'guild-1', userId: 'user-1', nickname: 'Boss', joinedAt: new Date('2026-08-01T12:00:00Z'), roleIds: ['role-1'] }],
  });
});

test('syncs cached guilds on the Discord.js clientReady event', async () => {
  const client = new EventEmitter();
  client.guilds = { cache: new Map([[guild.id, guild]]) };
  const repository = fakeRepository();
  attachDiscordEventHandlers({ client, dataRepository: repository, logger: { error: () => {} } });

  client.emit('clientReady');
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(repository.calls.map(([type]) => type), ['guild', 'channels', 'roles', 'user', 'members', 'guildFullSync']);
  assert.ok(repository.calls[5][1].syncedAt instanceof Date);
});


test('records a failed guild sync without replacing the last successful full-sync state', async () => {
  const client = new EventEmitter();
  const repository = fakeRepository();
  const logged = [];
  const inaccessibleGuild = { ...guild, members: { fetch: async () => { throw new Error('Missing Access: privileged GuildMembers intent'); } } };
  client.guilds = { cache: new Map([[inaccessibleGuild.id, inaccessibleGuild]]) };
  attachDiscordEventHandlers({ client, dataRepository: repository, logger: { error: (...args) => logged.push(args) } });

  client.emit('clientReady');
  await new Promise((resolve) => setImmediate(resolve));

  const failure = repository.calls.find(([type]) => type === 'guildFullSyncFailure');
  assert.ok(failure);
  assert.equal(failure[1].guildId, 'guild-1');
  assert.match(failure[1].errorMessage, /privileged GuildMembers intent/);
  assert.equal(repository.calls.some(([type]) => type === 'guildFullSync'), false);
  assert.equal(logged.length, 1);
});

test('reconciles every guild daily after clientReady and clears the timer on shutdown', async () => {
  const client = new EventEmitter();
  client.guilds = { cache: new Map([[guild.id, guild]]) };
  const repository = fakeRepository();
  const timers = [];
  const cleared = [];
  const stop = attachDiscordEventHandlers({
    client, dataRepository: repository, logger: { error: () => {} },
    setIntervalFn: (callback, intervalMs) => { const timer = { callback, intervalMs }; timers.push(timer); return timer; },
    clearIntervalFn: (timer) => cleared.push(timer),
  });

  client.emit('clientReady');
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(timers.length, 1);
  assert.equal(timers[0].intervalMs, 24 * 60 * 60 * 1000);
  await timers[0].callback();
  assert.equal(repository.calls.filter(([type]) => type === 'guildFullSync').length, 2);
  stop();
  assert.deepEqual(cleared, [timers[0]]);
});

test('reconciles Discord guild, channel, role and member events without waiting for the daily snapshot', async () => {
  const client = new EventEmitter();
  const repository = fakeRepository();
  attachDiscordEventHandlers({ client, dataRepository: repository, logger: { error: () => {} } });
  const channel = guild.channels.cache.get('channel-1');
  const role = { ...guild.roles.cache.get('role-1'), guild };
  const member = (await guild.members.fetch()).get('user-1');
  const changedMember = { ...member, nickname: 'Updated', roles: { cache: new Map([['role-1', { id: 'role-1' }]]) } };

  client.emit('guildUpdate', guild, { ...guild, name: 'Renamed guild' });
  client.emit('channelUpdate', channel, { ...channel, name: 'renamed-general' });
  client.emit('channelDelete', channel);
  client.emit('roleCreate', role);
  client.emit('roleDelete', role);
  client.emit('guildMemberAdd', { ...member, guild });
  client.emit('guildMemberUpdate', { ...member, guild }, { ...changedMember, guild });
  client.emit('guildMemberRemove', { ...member, guild });
  client.emit('guildDelete', guild);
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(repository.calls.map(([type]) => type), [
    'guild', 'channel', 'deleteChannel', 'role', 'deleteRole',
    'user', 'member', 'replaceMemberRoles', 'user', 'member', 'replaceMemberRoles',
    'removeMember', 'deleteGuild',
  ]);
  assert.equal(repository.calls[0][1].name, 'Renamed guild');
  assert.equal(repository.calls[1][1].name, 'renamed-general');
  assert.deepEqual(repository.calls[7][1], { guildId: 'guild-1', userId: 'user-1', roleIds: ['role-1'] });
  assert.deepEqual(repository.calls[11][1], { guildId: 'guild-1', userId: 'user-1' });
});
