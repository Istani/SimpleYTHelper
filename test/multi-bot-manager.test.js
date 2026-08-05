import assert from 'node:assert/strict';
import test from 'node:test';
import { createMultiBotManager } from '../src/discord-adapter/multi-bot-manager.js';

test('registers and starts bots with their respective tokens, settings, and reports back their user IDs', async () => {
  const launchedBots = [];
  const fakeClientFactory = ({ token, settings }) => ({
    token,
    settings,
    user: { id: token === 'discord-token-alpha' ? 'bot-user-for-alpha' : 'bot-user-for-beta' },
    isReady: () => true,
    login: async () => {},
    destroy: async () => {},
  });

  const manager = createMultiBotManager({ clientFactory: fakeClientFactory });
  
  const registrations = [
    { bot_id: 'bot-1', token: 'discord-token-alpha', settings: { allowCommands: true, allowReports: false } },
    { bot_id: 'bot-2', token: 'discord-token-beta', settings: { allowCommands: false, allowReports: true } },
  ];

  const results = await manager.initializeBots(registrations);

  assert.equal(results.length, 2);
  assert.equal(results[0].bot_id, 'bot-1');
  assert.equal(results[0].discord_user_id, 'bot-user-for-alpha');
  assert.equal(results[1].bot_id, 'bot-2');
  assert.equal(results[1].discord_user_id, 'bot-user-for-beta');
});

test('prevents duplicate bot_id registration and handles missing tokens gracefully', async () => {
  const manager = createMultiBotManager({
    clientFactory: () => ({
      user: { id: '123' },
      isReady: () => true,
      login: async () => {},
    }),
  });

  await manager.initializeBots([
    { bot_id: 'bot-1', token: 'token-1', settings: {} },
  ]);

  await assert.rejects(
    () => manager.initializeBots([{ bot_id: 'bot-1', token: 'token-2', settings: {} }]),
    { message: /already registered/i }
  );

  await assert.rejects(
    () => manager.initializeBots([{ bot_id: 'bot-3', token: '', settings: {} }]),
    { message: /token is required/i }
  );
});
