import assert from 'node:assert/strict';
import test from 'node:test';
import { formatDiscordMessageMedia } from '../src/web/message-media.js';

test('formats Discord media as icon and safe external link data without preview markup', () => {
  assert.deepEqual(
    formatDiscordMessageMedia({ kind: 'attachment', label: 'diagram.png', url: 'https://cdn.discordapp.com/attachments/1/diagram.png' }),
    { icon: '📎', text: 'Datei: diagram.png', href: 'https://cdn.discordapp.com/attachments/1/diagram.png' },
  );
  assert.deepEqual(
    formatDiscordMessageMedia({ kind: 'embed', label: 'Release notes', url: 'https://example.test/release-notes' }),
    { icon: '🔗', text: 'Embed: Release notes', href: 'https://example.test/release-notes' },
  );
  assert.deepEqual(
    formatDiscordMessageMedia({ kind: 'sticker', label: 'Daumen hoch', url: 'javascript:alert(1)' }),
    { icon: '🏷️', text: 'Sticker: Daumen hoch', href: null },
  );
});
