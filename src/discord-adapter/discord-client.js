export function createDiscordClientAdapter({ client }) {
  return {
    async sendDelivery({ target, content }) {
      if (!client || typeof client.isReady !== 'function' || !client.isReady()) {
        throw new Error('Discord client is not ready');
      }

      const channel = await client.channels.fetch(target.channel_id);
      if (!channel || typeof channel.send !== 'function') {
        throw new Error(`Discord channel ${target.channel_id} not found or invalid`);
      }

      await channel.send(content);
      return { status: 'sent' };
    },
  };
}
