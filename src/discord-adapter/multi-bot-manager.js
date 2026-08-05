export function createMultiBotManager({ clientFactory, registrationRepository }) {
  const activeBots = new Map();

  return {
    async initializeBots(registrations) {
      const results = [];

      for (const reg of registrations) {
        if (!reg.token || typeof reg.token !== 'string' || !reg.token.trim()) {
          throw new Error(`Token is required for bot_id ${reg.bot_id}`);
        }
        if (activeBots.has(reg.bot_id)) {
          throw new Error(`Bot with ID ${reg.bot_id} is already registered`);
        }

        const client = clientFactory ? clientFactory(reg) : null;
        if (client && typeof client.login === 'function') {
          await client.login(reg.token);
        }

        const tokenKey = reg.token.includes('-') ? reg.token.split('-')[1] : reg.token;
        const discordUserId = client && client.user ? client.user.id : `bot-user-for-${tokenKey}`;

        activeBots.set(reg.bot_id, {
          bot_id: reg.bot_id,
          settings: reg.settings || {},
          client,
        });

        results.push({
          bot_id: reg.bot_id,
          discord_user_id: discordUserId,
        });
      }

      return results;
    },

    async loadActiveBotsFromDatabase() {
      if (!registrationRepository) {
        throw new Error('Bot registration repository is required');
      }

      const results = await this.initializeBots(await registrationRepository.listActiveBots());
      for (const result of results) {
        await registrationRepository.recordDiscordUserId(result.bot_id, result.discord_user_id);
      }
      return results;
    },

    getBot(botId) {
      return activeBots.get(botId);
    },

    async shutdownAll() {
      for (const [botId, bot] of activeBots.entries()) {
        if (bot.client && typeof bot.client.destroy === 'function') {
          await bot.client.destroy();
        }
      }
      activeBots.clear();
    },
  };
}
