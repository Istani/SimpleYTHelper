const mediaPresentation = {
  attachment: { icon: '📎', label: 'Datei' },
  embed: { icon: '🔗', label: 'Embed' },
  sticker: { icon: '🏷️', label: 'Sticker' },
};

function safeExternalUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

export function formatDiscordMessageMedia(media) {
  const presentation = mediaPresentation[media?.kind] ?? { icon: '📄', label: 'Medium' };
  const label = String(media?.label || presentation.label).trim() || presentation.label;
  return {
    icon: presentation.icon,
    text: `${presentation.label}: ${label}`,
    href: safeExternalUrl(media?.url),
  };
}
