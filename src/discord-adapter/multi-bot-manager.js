export function createMultiBotManager({ clientFactory, registrationRepository, onClientStarted }) {
  const activeBots = new Map();

  async function startBot(reg) {
    if (!reg.token || typeof reg.token !== 'string' || !reg.token.trim()) {
      throw new Error(`Token is required for bot_id ${reg.bot_id}`);
    }
    const client = clientFactory ? clientFactory(reg) : null;
    if (client && typeof client.once === 'function') {
      const recoverOnConnectionFault = () => {
        void stopBot(reg.bot_id);
      };
      client.once('error', recoverOnConnectionFault);
      client.once('shardDisconnect', recoverOnConnectionFault);
    }
    if (client && typeof onClientStarted === 'function') {
      onClientStarted({ client, registration: reg });
    }
    if (client && typeof client.login === 'function') {
      await client.login(reg.token);
    }

    const tokenKey = reg.token.includes('-') ? reg.token.split('-')[1] : reg.token;
    const discordUserId = client && client.user ? client.user.id : `bot-user-for-${tokenKey}`;

    activeBots.set(reg.bot_id, {
      bot_id: reg.bot_id,
      token: reg.token,
      settings: reg.settings || {},
      client,
      discordUserId,
    });

    return {
      bot_id: reg.bot_id,
      discord_user_id: discordUserId,
    };
  }

  async function stopBot(botId) {
    const bot = activeBots.get(botId);
    if (bot) {
      if (bot.client && typeof bot.client.destroy === 'function') {
        await bot.client.destroy();
      }
      activeBots.delete(botId);
    }
  }

  return {
    async initializeBots(registrations) {
      const results = [];

      for (const reg of registrations) {
        if (activeBots.has(reg.bot_id)) {
          throw new Error(`Bot with ID ${reg.bot_id} is already registered`);
        }
        const result = await startBot(reg);
        results.push(result);
      }

      return results;
    },

    async loadActiveBotsFromDatabase() {
      if (!registrationRepository) {
        throw new Error('Bot registration repository is required');
      }

      const registrations = await registrationRepository.listActiveBots();
      const results = await this.initializeBots(registrations);
      for (const result of results) {
        await registrationRepository.recordDiscordUserId(result.bot_id, result.discord_user_id);
      }
      return results;
    },

    async pollAndSyncBots() {
      if (!registrationRepository) {
        throw new Error('Bot registration repository is required');
      }

      const latestRegistrations = await registrationRepository.listActiveBots();
      const latestMap = new Map(latestRegistrations.map((reg) => [reg.bot_id, reg]));

      const started = [];
      const stopped = [];
      const updated = [];
      const unchanged = [];

      // 1. Check existing bots against latest
      for (const [botId, currentBot] of activeBots.entries()) {
        const latestReg = latestMap.get(botId);
        if (!latestReg || !latestReg.token) {
          await stopBot(botId);
          stopped.push(botId);
        } else {
          // Check if token or settings changed
          const tokenChanged = latestReg.token !== currentBot.token;
          const settingsChanged = JSON.stringify(latestReg.settings || {}) !== JSON.stringify(currentBot.settings || {});
          
          if (tokenChanged || settingsChanged) {
            await stopBot(botId);
            const res = await startBot(latestReg);
            await registrationRepository.recordDiscordUserId(res.bot_id, res.discord_user_id);
            updated.push(botId);
          } else {
            unchanged.push(botId);
          }
        }
      }

      // 2. Check for new bots in latest not currently active
      for (const reg of latestRegistrations) {
        if (!activeBots.has(reg.bot_id)) {
          const res = await startBot(reg);
          await registrationRepository.recordDiscordUserId(res.bot_id, res.discord_user_id);
          started.push(reg.bot_id);
        }
      }

      return { started, stopped, updated, unchanged };
    },

    getBot(botId) {
      return activeBots.get(botId);
    },

    listActiveBotsStatus() {
      const statusList = [];
      for (const [botId, bot] of activeBots.entries()) {
        const isReady = bot.client && typeof bot.client.isReady === 'function' ? bot.client.isReady() : false;
        statusList.push({
          bot_id: botId,
          settings: bot.settings,
          discord_user_id: bot.discordUserId,
          ready: isReady,
        });
      }
      return statusList;
    },

    async shutdownAll() {
      for (const botId of Array.from(activeBots.keys())) {
        await stopBot(botId);
      }
    },
  };
}
