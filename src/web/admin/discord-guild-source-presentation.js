function displayName(user, fallback) {
  return user?.globalName || user?.username || fallback;
}

function sourceNames(accounts, accountKind) {
  return accounts
    .filter((account) => account.accountKind === accountKind)
    .map((account) => displayName(account.accountUser, account.botId))
    .filter(Boolean);
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
    const enrichedGuild = { ...guild, botNames: sourceNames(accounts, 'bot'), selfbotNames: sourceNames(accounts, 'selfbot') };
    if (enrichedGuild.botNames.length) withBots.push(enrichedGuild);
    else selfbotOnly.push(enrichedGuild);
  }
  return { withBots, selfbotOnly };
}
