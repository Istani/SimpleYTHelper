import assert from 'node:assert/strict';
import test from 'node:test';
import { createDiscordDataRepository } from '../src/discord-adapter/discord-data-repository.js';

test('upserts guild, user, channel, role, message, member, and member roles through prisma', async () => {
  const calls = [];
  const prisma = {
    discordGuild: {
      upsert: async (args) => { calls.push({ model: 'guild', args }); return { id: args.where.id }; },
    },
    discordUser: {
      upsert: async (args) => { calls.push({ model: 'user', args }); return { id: args.where.id }; },
    },
    discordChannel: {
      upsert: async (args) => { calls.push({ model: 'channel', args }); return { id: args.where.id }; },
    },
    discordRole: {
      upsert: async (args) => { calls.push({ model: 'role', args }); return { id: args.where.id }; },
    },
    discordMessage: {
      upsert: async (args) => { calls.push({ model: 'message', args }); return { id: args.where.id }; },
    },
    discordGuildMember: {
      upsert: async (args) => { calls.push({ model: 'guildMember', args }); return args.where.guildId_userId; },
    },
    discordMemberRole: {
      upsert: async (args) => { calls.push({ model: 'memberRole', args }); return args.where.guildId_userId_roleId; },
      delete: async (args) => { calls.push({ model: 'deleteMemberRole', args }); return {}; },
    },
  };

  const repo = createDiscordDataRepository({ prisma });

  await repo.upsertGuild({ id: 'g1', name: 'Test Guild', icon: 'icon.png', ownerId: 'u1' });
  await repo.upsertUser({ id: 'u1', username: 'testuser', isBot: false });
  await repo.upsertChannel({ id: 'c1', guildId: 'g1', name: 'general', type: 0 });
  await repo.upsertRole({ id: 'r1', guildId: 'g1', name: 'Admin', permissions: '8' });
  await repo.saveMessage({ id: 'm1', channelId: 'c1', guildId: 'g1', authorId: 'u1', content: 'Hello World' });
  await repo.upsertGuildMember({ guildId: 'g1', userId: 'u1', nickname: 'Boss' });
  await repo.assignMemberRole({ guildId: 'g1', userId: 'u1', roleId: 'r1' });
  await repo.removeMemberRole({ guildId: 'g1', userId: 'u1', roleId: 'r1' });

  assert.equal(calls.length, 8);
  assert.equal(calls[5].model, 'guildMember');
  assert.equal(calls[6].model, 'memberRole');
  assert.equal(calls[7].model, 'deleteMemberRole');
});
