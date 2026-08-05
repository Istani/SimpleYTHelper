export function mergeBotRuntimeStatus(records, adapterBots) {
  const runtimeByBotId = new Map((adapterBots || []).map((bot) => [bot.bot_id, bot]));
  return records.map((record) => {
    const runtime = runtimeByBotId.get(record.botId);
    return {
      ...record,
      online: Boolean(runtime),
      ready: Boolean(runtime?.ready),
    };
  });
}

export function formatBerlinTimestamp(timestamp) {
  const parts = new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(timestamp));
  const value = (type) => parts.find((part) => part.type === type)?.value;
  return `${value('day')}.${value('month')}.${value('year')} ${value('hour')}:${value('minute')}:${value('second')}`;
}
