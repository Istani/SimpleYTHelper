import assert from 'node:assert/strict';
import test from 'node:test';
import { discordModerationDestination, discordServiceAreas } from '../src/web/admin/discord-moderation.js';

test('routes guild and direct-message records to their dedicated moderation detail views', () => {
  assert.deepEqual(
    discordModerationDestination({ id: 'guild-1', name: 'Community' }, 'guild'),
    { href: '/admin/discord/moderation/guilds/guild-1', label: 'Community' },
  );
  assert.deepEqual(
    discordModerationDestination({ id: 'dm-1', name: 'Direktnachricht' }, 'dm'),
    { href: '/admin/discord/moderation/dms/dm-1', label: 'Direktnachricht' },
  );
});

test('keeps Discord areas under an extensible service namespace', () => {
  assert.deepEqual(discordServiceAreas(), [
    { href: '/admin/discord/moderation', icon: '🛡️', title: 'Moderation', description: 'Server, direkte Nachrichten, Mitglieder, Rollen und Channels prüfen.' },
    { href: '/admin/discord/bots', icon: '🤖', title: 'Bots', description: 'Bot-Status und SimpleYTH-Capabilities verwalten.' },
  ]);
});
