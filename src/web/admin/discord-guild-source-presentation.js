function accountLabel(source) {
  const accountId = source.discordUserId || source.botId;
  return source.accountKind === 'bot' ? `Bot: ${accountId}` : `Selfbot: ${accountId}`;
}

export function partitionGuildsByObservedAccounts(guilds, observations) {
  const sourcesByGuildId = new Map();
  for (const observation of observations || []) {
    if (!observation?.entityId || !observation.source) continue;
    const existing = sourcesByGuildId.get(observation.entityId) || [];
    if (!existing.some(({ botId }) => botId === observation.source.botId)) existing.push(observation.source);
    sourcesByGuildId.set(observation.entityId, existing);
  }

  const withBots = [];
  const selfbotOnly = [];
  for (const guild of guilds || []) {
    const accounts = sourcesByGuildId.get(guild.id) || [];
    const enrichedGuild = { ...guild, observedAccounts: accounts, observedAccountLabels: accounts.map(accountLabel) };
    if (accounts.some(({ accountKind }) => accountKind === 'bot')) withBots.push(enrichedGuild);
    else selfbotOnly.push(enrichedGuild);
  }
  return { withBots, selfbotOnly };
}
