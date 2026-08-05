import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { createDiscordAdapterRuntime } from '../src/discord-adapter/runtime.js';
import { createDiscordBotRuntime } from '../src/discord-adapter/bot-runtime.js';

test('end-to-end smoke test of discord adapter runtime, bot registration loading, and http endpoints', async () => {
  const prisma = {
    discordBotRegistration: {
      findMany: async () => [{
        botId: 'test-bot-1',
        token: 'fake-token-xyz',
        settings: { allowReports: true },
      }],
      update: async () => ({}),
    },
    $disconnect: async () => {},
  };

  const botRuntime = createDiscordBotRuntime({
    prisma,
    clientFactory: () => ({
      user: { id: '999888777666555444' },
      login: async () => {},
      destroy: async () => {},
      isReady: () => true,
    }),
  });

  const startedBots = await botRuntime.start();
  assert.equal(startedBots.length, 1);
  assert.equal(startedBots[0].bot_id, 'test-bot-1');

  const runtime = createDiscordAdapterRuntime({
    environment: { INTERNAL_ADAPTER_TOKEN: 'smoke-token' },
    createPrismaClient: () => prisma,
    botManager: botRuntime.manager,
  });

  const server = runtime.app.listen(0);
  await once(server, 'listening');
  const { port } = server.address();

  try {
    // 1. Check healthz (no auth required)
    const healthRes = await fetch(`http://127.0.0.1:${port}/healthz`);
    assert.equal(healthRes.status, 200);
    assert.deepEqual(await healthRes.json(), { status: 'ok' });

    // 2. Check bots endpoint with valid auth
    const botsRes = await fetch(`http://127.0.0.1:${port}/internal/v1/bots`, {
      headers: { authorization: 'Bearer smoke-token' },
    });
    assert.equal(botsRes.status, 200);
    const botsData = await botsRes.json();
    assert.equal(botsData.bots.length, 1);
    assert.equal(botsData.bots[0].bot_id, 'test-bot-1');
    assert.equal(botsData.bots[0].discord_user_id, '999888777666555444');
    assert.equal(botsData.bots[0].ready, true);
  } finally {
    server.close();
    await once(server, 'close');
    await botRuntime.shutdown();
    await prisma.$disconnect();
  }
});
