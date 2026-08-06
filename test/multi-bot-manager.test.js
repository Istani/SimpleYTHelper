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

test('loads active bot registrations from the database repository and persists returned Discord user IDs', async () => {
  const recordedUserIds = [];
  const registrationRepository = {
    listActiveBots: async () => [
      {
        bot_id: 'reporting-bot',
        token: 'db-managed-token',
        settings: { allowReports: true, allowCommands: false },
      },
    ],
    recordDiscordUserId: async (botId, discordUserId) => {
      recordedUserIds.push({ botId, discordUserId });
    },
  };
  const manager = createMultiBotManager({
    clientFactory: () => ({
      user: { id: '987654321012345678' },
      login: async () => {},
    }),
    registrationRepository,
  });

  const result = await manager.loadActiveBotsFromDatabase();

  assert.deepEqual(result, [{ bot_id: 'reporting-bot', discord_user_id: '987654321012345678' }]);
  assert.deepEqual(recordedUserIds, [{ botId: 'reporting-bot', discordUserId: '987654321012345678' }]);
  assert.equal(manager.getBot('reporting-bot').settings.allowReports, true);
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

test('removes a bot with a Discord connection failure so the registration poller can reconnect it', async () => {
  const { EventEmitter } = await import('node:events');
  const client = new EventEmitter();
  client.user = { id: 'bot-discord-user' };
  client.login = async () => {};
  client.destroy = async () => {};

  const manager = createMultiBotManager({ clientFactory: () => client });
  await manager.initializeBots([{ bot_id: 'recoverable-bot', token: 'token', settings: {} }]);
  client.emit('error', new Error('gateway connection failed'));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(manager.getBot('recoverable-bot'), undefined);
});

test('releases a client lifecycle cleanup before destroying a stopped bot', async () => {
  const lifecycle = [];
  const manager = createMultiBotManager({
    clientFactory: () => ({ user: { id: 'bot-user' }, login: async () => {}, destroy: async () => lifecycle.push('destroy') }),
    onClientStarted: () => () => lifecycle.push('cleanup'),
  });

  await manager.initializeBots([{ bot_id: 'timer-bot', token: 'token', settings: {} }]);
  await manager.shutdownAll();

  assert.deepEqual(lifecycle, ['cleanup', 'destroy']);
});
