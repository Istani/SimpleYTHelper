export function discordModerationDestination(record, kind) {
  const segment = kind === 'dm' ? 'dms' : 'guilds';
  return {
    href: `/admin/discord/moderation/${segment}/${encodeURIComponent(record.id)}`,
    label: record.name || (kind === 'dm' ? 'Direktnachricht' : 'Unbenannter Server'),
  };
}

export function discordServiceAreas() {
  return [
    {
      href: '/admin/discord/moderation',
      icon: '🛡️',
      title: 'Moderation',
      description: 'Server, direkte Nachrichten, Mitglieder, Rollen und Channels prüfen.',
    },
    {
      href: '/admin/discord/bots',
      icon: '🤖',
      title: 'Bots',
      description: 'Bot-Status und SimpleYTH-Capabilities verwalten.',
    },
  ];
}
