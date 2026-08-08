import assert from 'node:assert/strict';
import test from 'node:test';
import { createDiscordBotRuntime, createDiscordAccountRuntime } from '../src/discord-adapter/bot-runtime.js';

test('starts every active database registration and writes its Discord user ID back through Prisma', async () => {
  const prismaCalls = [];
  const prisma = {
    discordBotRegistration: {
      findMany: async () => [{
        botId: 'announcements',
        token: 'database-managed-token',
        settings: { allowReports: true },
      }],
      update: async (args) => prismaCalls.push(args),
    },
  };
  const runtime = createDiscordBotRuntime({
    prisma,
    clientFactory: () => ({
      user: { id: '444444444444444444' },
      login: async () => {},
      destroy: async () => {},
    }),
  });

  const started = await runtime.start();

  assert.deepEqual(started, [{ bot_id: 'announcements', discord_user_id: '444444444444444444' }]);
  assert.deepEqual(prismaCalls, [{
    where: { botId: 'announcements' },
    data: { discordUserId: '444444444444444444' },
  }]);
});

test('uses the shared runtime core while filtering an isolated selfbot entrypoint', async () => {
  const queries = [];
  const prisma = {
    discordBotRegistration: {
      findMany: async (args) => { queries.push(args); return []; },
      update: async () => {},
    },
  };
  const runtime = createDiscordAccountRuntime({ prisma, accountKind: 'selfbot', clientFactory: () => null, logger: { error: () => {} } });

  assert.deepEqual(await runtime.start(), []);
  assert.deepEqual(queries, [{ where: { isActive: true, accountKind: 'selfbot' } }]);
});
