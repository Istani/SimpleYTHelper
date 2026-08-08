import assert from 'node:assert/strict';
import test from 'node:test';
import { EventEmitter } from 'node:events';
import { createPrismaBotRegistrationRepository } from '../src/discord-adapter/prisma-bot-registration-repository.js';
import { attachDiscordEventHandlers } from '../src/discord-adapter/discord-event-handler.js';

test('loads only active registrations for the runtime account kind', async () => {
  const calls = [];
  const prisma = {
    discordBotRegistration: {
      findMany: async (args) => {
        calls.push(args);
        return [{ botId: 'selfbot-alpha', token: 'database-token', settings: { listenMessages: true }, accountKind: 'selfbot' }];
      },
    },
  };

  const repository = createPrismaBotRegistrationRepository({ prisma, accountKind: 'selfbot' });
  const registrations = await repository.listActiveBots();

  assert.deepEqual(calls, [{ where: { isActive: true, accountKind: 'selfbot' } }]);
  assert.deepEqual(registrations, [{ bot_id: 'selfbot-alpha', token: 'database-token', settings: { listenMessages: true }, account_kind: 'selfbot' }]);
});

test('records scheduled Discord events and source observations without sending messages', async () => {
  const client = new EventEmitter();
  const calls = [];
  const dataRepository = {
    upsertScheduledEvent: async (value) => calls.push(['scheduledEvent', value]),
    recordSourceObservation: async (value) => calls.push(['observation', value]),
  };

  attachDiscordEventHandlers({
    client,
    dataRepository,
    sourceId: 'selfbot-alpha',
    logger: { error: () => {} },
  });

  client.emit('guildScheduledEventCreate', {
    id: 'event-1',
    guildId: 'guild-1',
    channelId: 'channel-1',
    creatorId: 'user-1',
    name: 'Release review',
    description: 'Architecture review',
    scheduledStartAt: new Date('2026-08-10T10:00:00Z'),
    scheduledEndAt: new Date('2026-08-10T11:00:00Z'),
    status: 1,
    entityType: 3,
    image: 'event-image',
  });
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(calls, [
    ['scheduledEvent', {
      id: 'event-1', guildId: 'guild-1', channelId: 'channel-1', creatorId: 'user-1', name: 'Release review', description: 'Architecture review',
      scheduledStartAt: new Date('2026-08-10T10:00:00Z'), scheduledEndAt: new Date('2026-08-10T11:00:00Z'), status: 1, entityType: 3, image: 'event-image',
    }],
    ['observation', { sourceId: 'selfbot-alpha', entityType: 'scheduled_event', entityId: 'event-1' }],
  ]);
});
