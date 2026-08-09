import assert from 'node:assert/strict';
import test from 'node:test';
import { partitionGuildsByObservedAccounts } from '../src/web/admin/discord-guild-source-presentation.js';

test('groups observed guilds with bots above selfbot-only guilds and lists every account', () => {
  const guilds = [{ id: 'both', name: 'Mit beiden' }, { id: 'self', name: 'Nur Selfbot' }, { id: 'unknown', name: 'Noch ohne Quelle' }];
  const observations = [
    { entityId: 'both', source: { botId: 'official', discordUserId: '10', accountKind: 'bot' } },
    { entityId: 'both', source: { botId: 'lara', discordUserId: '20', accountKind: 'selfbot' } },
    { entityId: 'self', source: { botId: 'biiru', discordUserId: '30', accountKind: 'selfbot' } },
  ];
  const result = partitionGuildsByObservedAccounts(guilds, observations);
  assert.deepEqual(result.withBots.map(({ id }) => id), ['both']);
  assert.deepEqual(result.withBots[0].observedAccountLabels, ['Bot: 10', 'Selfbot: 20']);
  assert.deepEqual(result.selfbotOnly.map(({ id }) => id), ['self', 'unknown']);
  assert.deepEqual(result.selfbotOnly[0].observedAccountLabels, ['Selfbot: 30']);
});
