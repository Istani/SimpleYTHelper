export function createPrismaBotRegistrationRepository({ prisma }) {
  return {
    async listActiveBots() {
      const records = await prisma.discordBotRegistration.findMany({
        where: { isActive: true },
      });

      return records.map((record) => ({
        bot_id: record.botId,
        token: record.token,
        settings: record.settings,
      }));
    },

    async recordDiscordUserId(botId, discordUserId) {
      await prisma.discordBotRegistration.update({
        where: { botId },
        data: { discordUserId },
      });
    },
  };
}
