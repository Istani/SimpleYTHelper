import assert from 'node:assert/strict';
import test from 'node:test';
import { startDiscordSelfbotServer } from '../src/discord-adapter/selfbot-server.js';

test('selfbot health and status server exposes no delivery endpoint', async () => {
  const calls = [];
  const instance = await startDiscordSelfbotServer({
    environment: { PORT: '0', INTERNAL_ADAPTER_TOKEN: 'test-internal-token', DISCORD_BOT_POLL_INTERVAL_MS: '600000' },
    prisma: { $disconnect: async () => calls.push('disconnect') },
    accountRuntime: {
      start: async () => [],
      shutdown: async () => calls.push('shutdown'),
      manager: {
        listActiveBotsStatus: () => [{ bot_id: 'selfbot-alpha', ready: true, settings: {} }],
        listActiveBotsGuildInventory: () => [{ bot_id: 'selfbot-alpha', discord_user_id: 'selfbot-user-1', ready: true, guilds: [{ id: 'guild-1', name: 'Test guild' }] }],
        pollAndSyncBots: async () => {},
      },
    },
    logger: { info: () => {}, error: () => {} },
  });
  try {
    const baseUrl = `http://127.0.0.1:${instance.server.address().port}`;
    const health = await fetch(`${baseUrl}/healthz`);
    assert.deepEqual(await health.json(), { status: 'ok', accountKind: 'selfbot' });
    const status = await fetch(`${baseUrl}/internal/v1/bots`, { headers: { authorization: 'Bearer test-internal-token' } });
    assert.deepEqual(await status.json(), { bots: [{ bot_id: 'selfbot-alpha', ready: true, settings: {} }] });
    const guildInventory = await fetch(`${baseUrl}/internal/v1/bots/guilds`, { headers: { authorization: 'Bearer test-internal-token' } });
    assert.equal(guildInventory.status, 200);
    assert.deepEqual(await guildInventory.json(), {
      bots: [{ bot_id: 'selfbot-alpha', discord_user_id: 'selfbot-user-1', ready: true, guilds: [{ id: 'guild-1', name: 'Test guild' }] }],
    });
    assert.equal((await fetch(`${baseUrl}/internal/v1/deliveries`)).status, 404);
  } finally {
    await instance.shutdown();
  }
  assert.deepEqual(calls, ['shutdown', 'disconnect']);
});
