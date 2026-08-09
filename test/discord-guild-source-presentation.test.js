import assert from 'node:assert/strict';
import test from 'node:test';
import { partitionGuildsByObservedAccounts } from '../src/web/admin/discord-guild-source-presentation.js';

test('groups guilds by actual bot members and renders stored account names', () => {
  const guilds = [
    { id: 'bots', name: 'Mit Bots', members: [{ user: { globalName: 'Moderationsbot', username: 'mod-bot' } }] },
    { id: 'self', name: 'Nur Selfbot', members: [] },
    { id: 'unknown', name: 'Noch ohne Quelle', members: [] },
  ];
  const observations = [
    { entityId: 'bots', source: { botId: 'official', discordUserId: '10', accountKind: 'bot', accountUser: { username: 'Offizieller Bot' } } },
    { entityId: 'bots', source: { botId: 'lara', discordUserId: '20', accountKind: 'selfbot', accountUser: { globalName: 'Lara' } } },
    { entityId: 'self', source: { botId: 'biiru', discordUserId: '30', accountKind: 'selfbot', accountUser: { username: 'Biiru' } } },
  ];
  const result = partitionGuildsByObservedAccounts(guilds, observations);
  assert.deepEqual(result.withBots.map(({ id }) => id), ['bots']);
  assert.deepEqual(result.withBots[0].botLabels, ['Bot: Moderationsbot']);
  assert.deepEqual(result.withBots[0].selfbotLabels, ['Selfbot: Lara']);
  assert.deepEqual(result.selfbotOnly.map(({ id }) => id), ['self', 'unknown']);
  assert.deepEqual(result.selfbotOnly[0].selfbotLabels, ['Selfbot: Biiru']);
});
