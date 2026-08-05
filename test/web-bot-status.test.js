import assert from 'node:assert/strict';
import test from 'node:test';
import { publicBotRegistration } from '../src/web/admin/bot-management.js';

test('publicBotRegistration preserves online status when provided', () => {
  const record = {
    botId: 'test-bot',
    settings: { allowReports: true },
    discordUserId: '123456789',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const pub = publicBotRegistration(record, { online: true, ready: true });
  assert.equal(pub.online, true);
  assert.equal(pub.ready, true);
});
