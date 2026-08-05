import assert from 'node:assert/strict';
import test from 'node:test';
import { createPrismaBotRegistrationRepository } from '../src/discord-adapter/prisma-bot-registration-repository.js';

test('lists only active database registrations and records the Discord user ID', async () => {
  const calls = [];
  const prisma = {
    discordBotRegistration: {
      findMany: async (args) => {
        calls.push({ operation: 'findMany', args });
        return [{ botId: 'reports', token: 'database-token', settings: { allowReports: true } }];
      },
      update: async (args) => {
        calls.push({ operation: 'update', args });
      },
    },
  };
  const repository = createPrismaBotRegistrationRepository({ prisma });

  const registrations = await repository.listActiveBots();
  await repository.recordDiscordUserId('reports', '123456789012345678');

  assert.deepEqual(registrations, [{
    bot_id: 'reports', token: 'database-token', settings: { allowReports: true },
  }]);
  assert.deepEqual(calls, [
    { operation: 'findMany', args: { where: { isActive: true } } },
    {
      operation: 'update',
      args: {
        where: { botId: 'reports' },
        data: { discordUserId: '123456789012345678' },
      },
    },
  ]);
});
