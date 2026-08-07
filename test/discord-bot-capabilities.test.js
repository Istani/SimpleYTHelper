import assert from 'node:assert/strict';
import test from 'node:test';
import { activeBotCapabilities } from '../src/web/admin/discord-bot-capabilities.js';

test('lists only explicitly enabled, known bot capabilities in operator language', () => {
  assert.deepEqual(
    activeBotCapabilities({ listenMessages: true, allowCommands: false, allowReports: true, unknown: true }),
    [
      { key: 'listenMessages', label: 'Nachrichten erfassen' },
      { key: 'allowReports', label: 'Reports zulassen' },
    ],
  );
});

test('treats missing or disabled settings as no active capabilities', () => {
  assert.deepEqual(activeBotCapabilities({ allowCommands: false }), []);
  assert.deepEqual(activeBotCapabilities(), []);
});
