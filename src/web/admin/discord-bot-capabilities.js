const CAPABILITIES = [
  ['listenMessages', 'Nachrichten erfassen'],
  ['allowCommands', 'Discord-Commands zulassen'],
  ['allowReports', 'Reports zulassen'],
];

export function activeBotCapabilities(settings = {}) {
  return CAPABILITIES
    .filter(([key]) => settings?.[key] === true)
    .map(([key, label]) => ({ key, label }));
}
