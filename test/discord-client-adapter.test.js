import assert from 'node:assert/strict';
import test from 'node:test';
import { createDiscordClientAdapter } from '../src/discord-adapter/discord-client.js';

test('sends a message via the provided discord.js client wrapper and updates the delivery status', async () => {
  const sentMessages = [];
  const fakeDiscordClient = {
    isReady: () => true,
    channels: {
      fetch: async (channelId) => ({
        id: channelId,
        send: async (content) => {
          sentMessages.push({ channelId, content });
          return { id: 'discord-msg-001' };
        },
      }),
    },
  };

  const adapter = createDiscordClientAdapter({ client: fakeDiscordClient });
  const result = await adapter.sendDelivery({
    target: { channel_id: '123456789012345678' },
    content: 'Wichtiges Spiel-Update',
  });

  assert.equal(result.status, 'sent');
  assert.equal(sentMessages.length, 1);
  assert.equal(sentMessages[0].channelId, '123456789012345678');
  assert.equal(sentMessages[0].content, 'Wichtiges Spiel-Update');
});

test('throws an error if the discord client is not ready when sending', async () => {
  const fakeDiscordClient = {
    isReady: () => false,
  };

  const adapter = createDiscordClientAdapter({ client: fakeDiscordClient });
  await assert.rejects(
    () => adapter.sendDelivery({
      target: { channel_id: '123456789012345678' },
      content: 'Test',
    }),
    { message: 'Discord client is not ready' },
  );
});
