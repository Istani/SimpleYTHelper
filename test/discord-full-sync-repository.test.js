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

  await repository.replaceGuildMembers({
    guildId: 'guild-1',
    members: [{ guildId: 'guild-1', userId: 'user-1', nickname: 'Boss', joinedAt: new Date('2026-08-01T12:00:00Z'), roleIds: ['role-1'] }],
  });
  await repository.recordGuildFullSync({ guildId: 'guild-1', syncedAt });
  await repository.recordGuildFullSyncFailure({ guildId: 'guild-1', failedAt: new Date('2026-08-06T15:00:00Z'), errorMessage: 'Missing Access' });

  assert.deepEqual(calls.map(([kind]) => kind), ['deleteMemberRoles', 'deleteMembers', 'member', 'memberRoles', 'guild', 'guild']);
  assert.deepEqual(calls[1][1], { where: { guildId: 'guild-1', userId: { notIn: ['user-1'] } } });
  assert.deepEqual(calls[3][1], { data: [{ guildId: 'guild-1', userId: 'user-1', roleId: 'role-1' }] });
  assert.deepEqual(calls[4][1], { where: { id: 'guild-1' }, data: { lastFullSyncAt: syncedAt, lastFullSyncFailedAt: null, lastFullSyncError: null } });
  assert.deepEqual(calls[5][1], { where: { id: 'guild-1' }, data: { lastFullSyncFailedAt: new Date('2026-08-06T15:00:00Z'), lastFullSyncError: 'Missing Access' } });
});
