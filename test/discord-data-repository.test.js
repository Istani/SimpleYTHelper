import assert from 'node:assert/strict';
import test from 'node:test';
import { createDiscordDataRepository } from '../src/discord-adapter/discord-data-repository.js';

test('upserts guild, user, channel, role, and message through prisma', async () => {
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
  };

  const repo = createDiscordDataRepository({ prisma });

  await repo.upsertGuild({ id: 'g1', name: 'Test Guild', icon: 'icon.png', ownerId: 'u1' });
  await repo.upsertUser({ id: 'u1', username: 'testuser', isBot: false });
  await repo.upsertChannel({ id: 'c1', guildId: 'g1', name: 'general', type: 0 });
  await repo.upsertRole({ id: 'r1', guildId: 'g1', name: 'Admin', permissions: '8' });
  await repo.saveMessage({ id: 'm1', channelId: 'c1', guildId: 'g1', authorId: 'u1', content: 'Hello World' });

  assert.equal(calls.length, 5);
  assert.equal(calls[0].model, 'guild');
  assert.equal(calls[1].model, 'user');
  assert.equal(calls[2].model, 'channel');
  assert.equal(calls[3].model, 'role');
  assert.equal(calls[4].model, 'message');
});
