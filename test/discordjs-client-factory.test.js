import assert from 'node:assert/strict';
import test from 'node:test';
import { createDiscordJsClientFactory } from '../src/discord-adapter/discordjs-client-factory.js';

test('creates a Discord client with only the gateway intents required by its settings', () => {
  const created = [];
  class FakeClient {
    constructor(options) {
      created.push(options);
    }
  }
  const intents = { Guilds: 1, GuildMessages: 2, MessageContent: 4 };
  const createClient = createDiscordJsClientFactory({ Client: FakeClient, GatewayIntentBits: intents });

  createClient({ settings: { listenMessages: true, allowCommands: true } });

  assert.deepEqual(created, [{ intents: [1, 2, 4] }]);
});

test('does not request message-reading intents for a send-only reporting bot', () => {
  const created = [];
  class FakeClient {
    constructor(options) {
      created.push(options);
    }
  }
  const intents = { Guilds: 1, GuildMessages: 2, MessageContent: 4 };
  const createClient = createDiscordJsClientFactory({ Client: FakeClient, GatewayIntentBits: intents });

  createClient({ settings: { allowReports: true } });

  assert.deepEqual(created, [{ intents: [1] }]);
});
