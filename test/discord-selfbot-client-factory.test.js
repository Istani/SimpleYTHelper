import assert from 'node:assert/strict';
import test from 'node:test';
import { createDiscordSelfbotClientFactory } from '../src/discord-adapter/discord-selfbot-client-factory.js';

test('creates a selfbot client without an outbound-message configuration', () => {
  const constructed = [];
  class FakeClient {
    constructor(options) { constructed.push(options); }
  }

  const factory = createDiscordSelfbotClientFactory({ Client: FakeClient });
  const client = factory({ settings: { listenMessages: true, allowOutboundMessages: false } });

  assert.ok(client instanceof FakeClient);
  assert.deepEqual(constructed, [{ checkUpdate: false }]);
});
