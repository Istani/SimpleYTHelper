import assert from 'node:assert/strict';
import test from 'node:test';
import { formatBerlinTimestamp, mergeBotRuntimeStatus } from '../src/web/admin/live-status.js';

test('marks a registered active bot offline when the live adapter response does not contain it', () => {
  const bots = mergeBotRuntimeStatus(
    [{ botId: 'SimpleYTH', isActive: true, settings: {}, discordUserId: '123' }],
    []
  );

  assert.deepEqual(bots, [{
    botId: 'SimpleYTH',
    isActive: true,
    settings: {},
    discordUserId: '123',
    online: false,
    ready: false,
  }]);
});

test('maps ready state exclusively from the authenticated live adapter status', () => {
  const bots = mergeBotRuntimeStatus(
    [{ botId: 'SimpleYTH', isActive: true, settings: {}, discordUserId: '123' }],
    [{ bot_id: 'SimpleYTH', ready: true }]
  );

  assert.equal(bots[0].online, true);
  assert.equal(bots[0].ready, true);
});

test('formats a UTC timestamp as DD.MM.YYYY HH:MM:SS in Europe/Berlin without locale words', () => {
  assert.equal(formatBerlinTimestamp('2026-08-05T22:14:42.000Z'), '06.08.2026 00:14:42');
});
