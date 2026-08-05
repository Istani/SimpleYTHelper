import assert from 'node:assert/strict';
import test from 'node:test';
import { createMultiBotManager } from '../src/discord-adapter/multi-bot-manager.js';

test('polls database repository and synchronizes bot instances: starts new, stops removed, and updates changed tokens or settings', async () => {
  const stoppedBotIds = [];
  const startedRegistrations = [];

  const fakeClientFactory = ({ bot_id, token }) => ({
    bot_id,
    token,
    user: { id: `user-${bot_id}` },
    isReady: () => true,
    login: async () => {},
    destroy: async () => {
      stoppedBotIds.push(bot_id);
    },
  });

  let activeRecords = [
    { bot_id: 'bot-1', token: 'token-one-original', settings: { allowReports: true } },
    { bot_id: 'bot-2', token: 'token-two', settings: { allowCommands: true } },
  ];

  const registrationRepository = {
    listActiveBots: async () => activeRecords,
    recordDiscordUserId: async () => {},
  };

  const manager = createMultiBotManager({
    clientFactory: fakeClientFactory,
    registrationRepository,
  });

  // Initial load
  await manager.loadActiveBotsFromDatabase();
  assert.equal(manager.getBot('bot-1').client.token, 'token-one-original');
  assert.equal(manager.getBot('bot-2').client.token, 'token-two');

  // Next poll:
  // - bot-1 token changed (rotation) and settings updated
  // - bot-2 remains unchanged
  // - bot-3 is newly added
  // - bot-4 (which was implied or removed) -> removed from active list (bot-2 stays, bot-1 stays, bot-3 added)
  // Let's test removing bot-2 and adding bot-3, plus rotating bot-1.
  activeRecords = [
    { bot_id: 'bot-1', token: 'token-one-rotated', settings: { allowReports: false, listenMessages: true } },
    { bot_id: 'bot-3', token: 'token-three', settings: { allowReports: true } },
  ];

  const syncResult = await manager.pollAndSyncBots();

  assert.deepEqual(syncResult, {
    started: ['bot-3'],
    stopped: ['bot-2'],
    updated: ['bot-1'],
    unchanged: ['bot-1'],
  });

  assert.equal(manager.getBot('bot-2'), undefined);
  assert.equal(manager.getBot('bot-3').client.token, 'token-three');
  assert.equal(manager.getBot('bot-1').client.token, 'token-one-rotated');
  assert.deepEqual(manager.getBot('bot-1').settings, { allowReports: false, listenMessages: true });
  assert.deepEqual(stoppedBotIds, ['bot-1', 'bot-2']); // bot-1 stopped and restarted due to token/settings change
});
