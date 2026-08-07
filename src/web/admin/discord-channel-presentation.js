const CHANNEL_TYPES = new Map([
  [0, { icon: '#', label: 'Textkanal', isThread: false }],
  [1, { icon: '✉', label: 'Direktnachricht', isThread: false }],
  [2, { icon: '🔊', label: 'Sprachkanal', isThread: false }],
  [3, { icon: '✉', label: 'Gruppen-DM', isThread: false }],
  [4, { icon: '▾', label: 'Kategorie', isThread: false }],
  [5, { icon: '📣', label: 'Ankündigungskanal', isThread: false }],
  [10, { icon: '↳', label: 'Ankündigungs-Thread', isThread: true }],
  [11, { icon: '↳', label: 'Öffentlicher Thread', isThread: true }],
  [12, { icon: '↳', label: 'Privater Thread', isThread: true }],
  [13, { icon: '🎙', label: 'Stage-Kanal', isThread: false }],
  [15, { icon: '▤', label: 'Forum', isThread: false }],
  [16, { icon: '▤', label: 'Medienkanal', isThread: false }],
]);

export function describeDiscordChannel(channel) {
  return CHANNEL_TYPES.get(channel.type) ?? { icon: '•', label: `Unbekannter Discord-Typ (${channel.type})`, isThread: false };
}

function byDiscordPosition(left, right) {
  return (left.position ?? 0) - (right.position ?? 0)
    || String(left.name ?? '').localeCompare(String(right.name ?? ''), 'de')
    || String(left.id).localeCompare(String(right.id));
}

export function sortDiscordGuildChannels(channels) {
  const byId = new Map(channels.map((channel) => [channel.id, channel]));
  const childrenByParent = new Map();
  const roots = [];
  for (const channel of channels) {
    if (channel.parentId && byId.has(channel.parentId)) {
      const children = childrenByParent.get(channel.parentId) ?? [];
      children.push(channel);
      childrenByParent.set(channel.parentId, children);
    } else roots.push(channel);
  }
  const result = [];
  const visited = new Set();
  const append = (channel, depth, parentName = null) => {
    if (visited.has(channel.id)) return;
    visited.add(channel.id);
    result.push({ ...channel, depth, parentName });
    for (const child of (childrenByParent.get(channel.id) ?? []).sort(byDiscordPosition)) append(child, depth + 1, channel.name || 'Unbenannter Channel');
  };
  for (const channel of roots.sort(byDiscordPosition)) append(channel, 0);
  for (const channel of channels.sort(byDiscordPosition)) append(channel, 0);
  return result;
}
