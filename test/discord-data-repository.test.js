import assert from 'node:assert/strict';
import test from 'node:test';
import { createDiscordDataRepository } from '../src/discord-adapter/discord-data-repository.js';

test('upserts guild, user, channel, role, message, member, member roles and bulk operations through prisma', async () => {
  const calls = [];
  const prisma = {
    $transaction: async (promises) => Promise.all(promises),
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
    discordMessageMedia: {
      deleteMany: async (args) => { calls.push({ model: 'deleteMessageMedia', args }); return { count: 0 }; },
      createMany: async (args) => { calls.push({ model: 'createMessageMedia', args }); return { count: args.data.length }; },
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
  await repo.bulkUpsertChannels([
    { id: 'c1', guildId: 'g1', name: 'general', type: 0 },
    { id: 'c2', guildId: 'g1', name: 'announcements', type: 0 },
  ]);
  await repo.bulkUpsertRoles([
    { id: 'r1', guildId: 'g1', name: 'Admin', permissions: '8' },
  ]);
  await repo.bulkUpsertMembers([
    { guildId: 'g1', userId: 'u1', nickname: 'Boss' },
  ]);
  await repo.assignMemberRole({ guildId: 'g1', userId: 'u1', roleId: 'r1' });

  assert.equal(calls.length, 7);
  assert.equal(calls[2].model, 'channel');
  assert.equal(calls[3].model, 'channel');
  assert.equal(calls[4].model, 'role');
  assert.equal(calls[5].model, 'guildMember');
  assert.equal(calls[5].args.create.deletedAt, null);
  assert.equal(calls[5].args.update.deletedAt, null);
  assert.equal(calls[5].args.update.nickname, 'Boss');
  assert.equal(calls[6].model, 'memberRole');
});

test('persists a complete structured media snapshot together with its Discord message', async () => {
  const calls = [];
  const prisma = {
    $transaction: async (operations) => Promise.all(operations),
    discordMessage: {
      upsert: async (args) => { calls.push({ model: 'message', args }); return { id: args.where.id }; },
    },
    discordMessageMedia: {
      deleteMany: async (args) => { calls.push({ model: 'deleteMessageMedia', args }); return { count: 0 }; },
      createMany: async (args) => { calls.push({ model: 'createMessageMedia', args }); return { count: args.data.length }; },
    },
  };
  const repo = createDiscordDataRepository({ prisma });

  await repo.saveMessage({
    id: 'message-1', channelId: 'channel-1', guildId: 'guild-1', authorId: 'user-1', content: 'Mit Medien',
    createdAt: new Date('2026-08-06T11:00:00Z'),
    media: [
      { kind: 'attachment', position: 0, sourceId: 'attachment-1', label: 'diagram.png', url: 'https://cdn.discordapp.com/attachments/1/diagram.png', contentType: 'image/png', sizeBytes: 1234, width: 640, height: 480, description: null, isSpoiler: false },
      { kind: 'sticker', position: 0, sourceId: 'sticker-1', label: 'Daumen hoch', url: 'https://cdn.discordapp.com/stickers/sticker-1.png', contentType: null, sizeBytes: null, width: null, height: null, description: null, isSpoiler: false },
    ],
  });

  assert.deepEqual(calls.map((call) => call.model), ['message', 'deleteMessageMedia', 'createMessageMedia']);
  assert.deepEqual(calls[1].args, { where: { messageId: 'message-1' } });
  assert.equal(calls[2].args.data[0].messageId, 'message-1');
  assert.equal(calls[2].args.data[1].kind, 'sticker');
});

test('splits a large guild channel snapshot into bounded transactions', async () => {
  const transactionSizes = [];
  const prisma = {
    $transaction: async (operations) => {
      transactionSizes.push(operations.length);
      return Promise.all(operations);
    },
    discordChannel: {
      updateMany: async () => ({ count: 0 }),
      upsert: async (args) => ({ id: args.where.id }),
    },
  };
  const channels = Array.from({ length: 201 }, (_, index) => ({
    id: `channel-${index}`, guildId: 'guild-1', name: `channel-${index}`, type: 0,
  }));

  await createDiscordDataRepository({ prisma }).replaceGuildChannels({ guildId: 'guild-1', channels });

  assert.deepEqual(transactionSizes, [50, 50, 50, 50, 1]);
});
