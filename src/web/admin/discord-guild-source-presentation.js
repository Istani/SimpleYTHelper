function displayName(user, fallback) {
  return user?.globalName || user?.username || fallback;
}

function accountLabel(source) {
  const name = displayName(source.accountUser, source.discordUserId || source.botId);
  return source.accountKind === 'bot' ? `Bot: ${name}` : `Selfbot: ${name}`;
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
    const observedAccounts = sourcesByGuildId.get(guild.id) || [];
    const botLabels = (guild.members || []).map(({ user }) => `Bot: ${displayName(user, 'Unbekannter Bot')}`);
    const selfbotLabels = observedAccounts.filter(({ accountKind }) => accountKind === 'selfbot').map(accountLabel);
    const enrichedGuild = { ...guild, botLabels, selfbotLabels };
    if (botLabels.length) withBots.push(enrichedGuild);
    else selfbotOnly.push(enrichedGuild);
  }
  return { withBots, selfbotOnly };
}
