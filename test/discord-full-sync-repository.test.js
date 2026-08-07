import assert from 'node:assert/strict';
import test from 'node:test';
import { createDiscordDataRepository } from '../src/discord-adapter/discord-data-repository.js';

test('replaces a guild member snapshot and records the successful full-sync time', async () => {
  const calls = [];
  const prisma = {
    $transaction: async (operations) => Promise.all(operations),
    discordGuild: { update: async (args) => { calls.push(['guild', args]); return args; } },
    discordGuildMember: {
      updateMany: async (args) => { calls.push(['softDeleteMembers', args]); return { count: 1 }; },
      upsert: async (args) => { calls.push(['member', args]); return args; },
    },
    discordMemberRole: {
      deleteMany: async (args) => { calls.push(['deleteMemberRoles', args]); return { count: 1 }; },
      createMany: async (args) => { calls.push(['memberRoles', args]); return { count: args.data.length }; },
    },
  };
  const repository = createDiscordDataRepository({ prisma });
  const syncedAt = new Date('2026-08-06T14:30:00Z');

  await repository.replaceGuildMembers({ guildId: 'guild-1', members: [{ guildId: 'guild-1', userId: 'user-1', nickname: 'Boss', joinedAt: new Date('2026-08-01T12:00:00Z'), roleIds: ['role-1'] }] });
  await repository.recordGuildFullSync({ guildId: 'guild-1', syncedAt });
  await repository.recordGuildFullSyncFailure({ guildId: 'guild-1', failedAt: new Date('2026-08-06T15:00:00Z'), errorMessage: 'Missing Access' });

  assert.deepEqual(calls.map(([kind]) => kind), ['deleteMemberRoles', 'softDeleteMembers', 'member', 'memberRoles', 'guild', 'guild']);
  assert.deepEqual(calls[1][1].where, { guildId: 'guild-1', userId: { notIn: ['user-1'] }, deletedAt: null });
  assert.ok(calls[1][1].data.deletedAt instanceof Date);
  assert.deepEqual(calls[3][1], { data: [{ guildId: 'guild-1', userId: 'user-1', roleId: 'role-1' }] });
  assert.deepEqual(calls[4][1], { where: { id: 'guild-1' }, data: { lastFullSyncAt: syncedAt, lastFullSyncFailedAt: null, lastFullSyncError: null } });
  assert.deepEqual(calls[5][1], { where: { id: 'guild-1' }, data: { lastFullSyncFailedAt: new Date('2026-08-06T15:00:00Z'), lastFullSyncError: 'Missing Access' } });
});

const expectAnyDate = { [Symbol.for('nodejs.util.inspect.custom')]: () => 'expectAnyDate' };

test('soft-deletes active channels and roles absent from a successful guild snapshot', async () => {
  const calls = [];
  const prisma = {
    $transaction: async (operations) => Promise.all(operations),
    discordChannel: {
      updateMany: async (args) => { calls.push(['channelsAbsent', args]); return args; },
      upsert: async (args) => { calls.push(['channel', args]); return args; },
    },
    discordRole: {
      updateMany: async (args) => { calls.push(['rolesAbsent', args]); return args; },
      upsert: async (args) => { calls.push(['role', args]); return args; },
    },
  };
  const repository = createDiscordDataRepository({ prisma });

  await repository.replaceGuildChannels({ guildId: 'guild-1', channels: [{ id: 'channel-1', guildId: 'guild-1', name: 'allgemein', type: 0 }] });
  await repository.replaceGuildRoles({ guildId: 'guild-1', roles: [{ id: 'role-1', guildId: 'guild-1', name: 'Mitglied', permissions: '0' }] });

  assert.deepEqual(calls[0][1].where, { guildId: 'guild-1', id: { notIn: ['channel-1'] }, deletedAt: null });
  assert.ok(calls[0][1].data.deletedAt instanceof Date);
  assert.equal(calls[1][1].update.deletedAt, null);
  assert.deepEqual(calls[2][1].where, { guildId: 'guild-1', id: { notIn: ['role-1'] }, deletedAt: null });
  assert.ok(calls[2][1].data.deletedAt instanceof Date);
  assert.equal(calls[3][1].update.deletedAt, null);
});

test('marks removed Discord records as deleted without removing their history', async () => {
  const calls = [];
  const prisma = {
    discordGuild: { updateMany: async (args) => { calls.push(['guild', args]); return args; } },
    discordChannel: { updateMany: async (args) => { calls.push(['channel', args]); return args; } },
    discordRole: { updateMany: async (args) => { calls.push(['role', args]); return args; } },
    discordGuildMember: { updateMany: async (args) => { calls.push(['member', args]); return args; } },
  };
  const repository = createDiscordDataRepository({ prisma });

  await repository.removeGuildMember({ guildId: 'guild-1', userId: 'user-1' });
  await repository.deleteChannel('channel-1');
  await repository.deleteRole('role-1');
  await repository.deleteGuild('guild-1');

  assert.deepEqual(calls.map(([kind]) => kind), ['member', 'channel', 'role', 'guild']);
  for (const [, args] of calls) {
    assert.equal(args.where.deletedAt, null);
    assert.ok(args.data.deletedAt instanceof Date);
  }
  assert.deepEqual(calls[0][1].where, { guildId: 'guild-1', userId: 'user-1', deletedAt: null });
});

test('restores a previously deleted record on a later Discord upsert', async () => {
  const calls = [];
  const prisma = {
    discordGuild: { upsert: async (args) => { calls.push(args); return args; } },
  };
  const repository = createDiscordDataRepository({ prisma });
  await repository.upsertGuild({ id: 'guild-1', name: 'Wieder da', icon: null, ownerId: 'owner-1' });
  assert.equal(calls[0].update.deletedAt, null);
  assert.equal(calls[0].create.deletedAt, null);
});
