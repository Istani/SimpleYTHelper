export function createPrismaBotRegistrationRepository({ prisma, accountKind = 'bot' }) {
  return {
    async listActiveBots() {
      const records = await prisma.discordBotRegistration.findMany({
        where: { isActive: true, accountKind },
      });

      return records.map((record) => ({
        bot_id: record.botId,
        token: record.token,
        settings: record.settings,
        account_kind: record.accountKind,
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
