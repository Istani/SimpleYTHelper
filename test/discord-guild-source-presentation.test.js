import assert from 'node:assert/strict';
import test from 'node:test';
import { partitionGuildsByObservedAccounts } from '../src/web/admin/discord-guild-source-presentation.js';

test('groups by owned account observations and presents names once per account kind', () => {
  const guilds = [{ id: 'both', name: 'Mit beiden' }, { id: 'self', name: 'Nur Selfbot' }, { id: 'foreign-bots', name: 'Fremde Bots' }];
  const observations = [
    { entityId: 'both', source: { botId: 'official', accountKind: 'bot', accountUser: { username: 'SimpleYTH' } } },
    { entityId: 'both', source: { botId: 'rpg', accountKind: 'bot', accountUser: { globalName: 'SimpleYTH-RPG' } } },
    { entityId: 'both', source: { botId: 'lara', accountKind: 'selfbot', accountUser: { globalName: 'Lara' } } },
    { entityId: 'self', source: { botId: 'biiru', accountKind: 'selfbot', accountUser: { username: 'Biiru' } } },
  ];
  const result = partitionGuildsByObservedAccounts(guilds, observations);
  assert.deepEqual(result.withBots.map(({ id }) => id), ['both']);
  assert.deepEqual(result.withBots[0].botNames, ['SimpleYTH', 'SimpleYTH-RPG']);
  assert.deepEqual(result.withBots[0].selfbotNames, ['Lara']);
  assert.deepEqual(result.selfbotOnly.map(({ id }) => id), ['self', 'foreign-bots']);
  assert.deepEqual(result.selfbotOnly[0].selfbotNames, ['Biiru']);
});
