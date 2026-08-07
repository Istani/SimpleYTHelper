import assert from 'node:assert/strict';
import test from 'node:test';
import { createDiscordDataRepository } from '../src/discord-adapter/discord-data-repository.js';

test('replaces a guild member snapshot and records the successful full-sync time', async () => {
  const calls = [];
  const prisma = {
    $transaction: async (operations) => Promise.all(operations),
    discordGuild: { update: async (args) => { calls.push(['guild', args]); return args; } },
    discordGuildMember: {
      deleteMany: async (args) => { calls.push(['deleteMembers', args]); return { count: 1 }; },
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

  assert.deepEqual(calls.map(([kind]) => kind), ['deleteMemberRoles', 'deleteMembers', 'member', 'memberRoles', 'guild', 'guild']);
  assert.deepEqual(calls[1][1], { where: { guildId: 'guild-1', userId: { notIn: ['user-1'] } } });
  assert.deepEqual(calls[3][1], { data: [{ guildId: 'guild-1', userId: 'user-1', roleId: 'role-1' }] });
  assert.deepEqual(calls[4][1], { where: { id: 'guild-1' }, data: { lastFullSyncAt: syncedAt, lastFullSyncFailedAt: null, lastFullSyncError: null } });
  assert.deepEqual(calls[5][1], { where: { id: 'guild-1' }, data: { lastFullSyncFailedAt: new Date('2026-08-06T15:00:00Z'), lastFullSyncError: 'Missing Access' } });
});

test('reconciles event-driven removals and replaces one member role snapshot atomically', async () => {
  const calls = [];
  const prisma = {
    $transaction: async (operations) => Promise.all(operations),
    discordGuild: { delete: async (args) => { calls.push(['guild', args]); return args; } },
    discordChannel: { delete: async (args) => { calls.push(['channel', args]); return args; } },
    discordRole: { delete: async (args) => { calls.push(['role', args]); return args; } },
    discordGuildMember: { delete: async (args) => { calls.push(['member', args]); return args; } },
    discordMemberRole: {
      deleteMany: async (args) => { calls.push(['deleteMemberRoles', args]); return args; },
      createMany: async (args) => { calls.push(['memberRoles', args]); return args; },
    },
  };
  const repository = createDiscordDataRepository({ prisma });

  await repository.replaceGuildMemberRoles({ guildId: 'guild-1', userId: 'user-1', roleIds: ['role-1', 'role-2'] });
  await repository.removeGuildMember({ guildId: 'guild-1', userId: 'user-1' });
  await repository.deleteChannel('channel-1');
  await repository.deleteRole('role-1');
  await repository.deleteGuild('guild-1');

  assert.deepEqual(calls, [
    ['deleteMemberRoles', { where: { guildId: 'guild-1', userId: 'user-1' } }],
    ['memberRoles', { data: [{ guildId: 'guild-1', userId: 'user-1', roleId: 'role-1' }, { guildId: 'guild-1', userId: 'user-1', roleId: 'role-2' }] }],
    ['member', { where: { guildId_userId: { guildId: 'guild-1', userId: 'user-1' } } }],
    ['channel', { where: { id: 'channel-1' } }],
    ['role', { where: { id: 'role-1' } }],
    ['guild', { where: { id: 'guild-1' } }],
  ]);
});
