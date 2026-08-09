export function discordAvatarUrl(user, size = 64) {
  if (!user?.id || !user?.avatar) return null;
  return `https://cdn.discordapp.com/avatars/${encodeURIComponent(user.id)}/${encodeURIComponent(user.avatar)}.png?size=${size}`;
}

function userName(user) {
  return user?.globalName || user?.username || 'Unbekannter Discord-Nutzer';
}

export function sortDirectMessagesByLatestMessage(channels) {
  return [...(channels || [])].sort((left, right) => {
    const latest = (channel) => new Date(channel.messages?.[0]?.createdAt || 0).getTime();
    return latest(right) - latest(left) || String(left.id).localeCompare(String(right.id));
  });
}

export function describeDirectMessage(channel) {
  const participants = [];
  const seen = new Set();
  for (const participant of channel?.participants?.length ? channel.participants : (channel?.messages ?? []).map((message) => ({ user: message?.author }))) {
    const user = participant?.user ?? participant;
    if (!user?.id || seen.has(user.id)) continue;
    seen.add(user.id);
    participants.push({ id: user.id, name: userName(user), avatarUrl: discordAvatarUrl(user) });
  }
  const isGroup = channel?.type === 3;
  const channelName = String(channel?.name || '').trim();
  const label = channelName || participants[0]?.name || (isGroup ? 'Unbenannte Gruppen-DM' : 'Direktnachricht');
  const names = participants.map(({ name }) => name).join(', ');
  return {
    label,
    participants,
    description: isGroup
      ? names ? `Gruppen-DM · zuletzt geschrieben von ${names}` : 'Gruppen-DM · noch keine gespeicherten Schreibenden'
      : participants[0] ? `Direktnachricht mit ${participants[0].name}` : 'Direktnachricht · noch keine gespeicherten Schreibenden',
  };
}
