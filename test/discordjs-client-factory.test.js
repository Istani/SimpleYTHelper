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
  const intents = { Guilds: 1, GuildMembers: 2, GuildMessages: 4, MessageContent: 8, DirectMessages: 16 };
  const partials = { Channel: 'CHANNEL' };
  const createClient = createDiscordJsClientFactory({ Client: FakeClient, GatewayIntentBits: intents, Partials: partials });

  createClient({ settings: { listenMessages: true, allowCommands: true } });

  assert.deepEqual(created, [{ intents: [1, 2, 4, 8, 16], partials: ['CHANNEL'] }]);
});

test('does not request message-reading intents for a send-only reporting bot', () => {
  const created = [];
  class FakeClient {
    constructor(options) {
      created.push(options);
    }
  }
  const intents = { Guilds: 1, GuildMembers: 2, GuildMessages: 4, MessageContent: 8 };
  const createClient = createDiscordJsClientFactory({ Client: FakeClient, GatewayIntentBits: intents });

  createClient({ settings: { allowReports: true } });

  assert.deepEqual(created, [{ intents: [1, 2] }]);
});

test('requests direct-message support and channel partials when inbound message listening is enabled', () => {
  const created = [];
  class FakeClient {
    constructor(options) {
      created.push(options);
    }
  }
  const intents = { Guilds: 1, GuildMembers: 2, GuildMessages: 4, MessageContent: 8, DirectMessages: 16 };
  const partials = { Channel: 'CHANNEL' };
  const createClient = createDiscordJsClientFactory({ Client: FakeClient, GatewayIntentBits: intents, Partials: partials });

  createClient({ settings: { listenMessages: true } });

  assert.deepEqual(created, [{ intents: [1, 2, 4, 8, 16], partials: ['CHANNEL'] }]);
});
