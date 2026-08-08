import { unemojify } from 'node-emoji';

export function normalizeDiscordMessageContent(content) {
  return unemojify(String(content ?? ''));
}

const DISCORD_CHANNEL_TYPE_BY_NAME = Object.freeze({
  GUILD_TEXT: 0,
  DM: 1,
  GUILD_VOICE: 2,
  GROUP_DM: 3,
  GUILD_CATEGORY: 4,
  GUILD_NEWS: 5,
  GUILD_ANNOUNCEMENT: 5,
  GUILD_NEWS_THREAD: 10,
  GUILD_ANNOUNCEMENT_THREAD: 10,
  GUILD_PUBLIC_THREAD: 11,
  GUILD_PRIVATE_THREAD: 12,
  GUILD_STAGE_VOICE: 13,
  GUILD_DIRECTORY: 14,
  GUILD_FORUM: 15,
  GUILD_MEDIA: 16,
});

function canonicalChannelType(type) {
  if (Number.isInteger(type)) return type;
  if (typeof type === 'string' && Number.isInteger(DISCORD_CHANNEL_TYPE_BY_NAME[type])) {
    return DISCORD_CHANNEL_TYPE_BY_NAME[type];
  }
  throw new TypeError(`Unsupported Discord channel type: ${String(type)}`);
}

function channelData(channel, guildId) {
  return {
    id: channel.id,
    guildId,
    name: channel.name ?? '',
    type: canonicalChannelType(channel.type),
    topic: channel.topic ?? null,
    position: channel.rawPosition ?? channel.position ?? 0,
    parentId: channel.parentId ?? null,
  };
}

function roleData(role, guildId) {
  return {
    id: role.id,
    guildId,
    name: role.name,
    color: role.color ?? 0,
    hoist: role.hoist,
    position: role.position ?? 0,
    permissions: role.permissions?.bitfield ?? role.permissions ?? '0',
    managed: role.managed,
    mentionable: role.mentionable,
  };
}

function userData(user) {
  return {
    id: user.id,
    username: user.username,
    discriminator: user.discriminator ?? null,
    globalName: user.globalName ?? null,
    avatar: user.avatar ?? null,
    isBot: user.bot,
  };
}

function collectionValues(value) {
  if (!value) return [];
  return Array.from(typeof value.values === 'function' ? value.values() : value);
}

async function hydrateGuildCache(client) {
  if (typeof client.guilds?.fetch !== 'function' || !client.guilds?.cache?.has) return;
  let after;
  do {
    const discovered = collectionValues(await client.guilds.fetch({ limit: 200, ...(after ? { after } : {}) }));
    for (const partialGuild of discovered) {
      if (!partialGuild?.id || client.guilds.cache.has(partialGuild.id)) continue;
      const fullGuild = await client.guilds.fetch({ guild: partialGuild.id, force: true });
      if (fullGuild?.id && !client.guilds.cache.has(fullGuild.id)) client.guilds.cache.set(fullGuild.id, fullGuild);
    }
    after = discovered.at(-1)?.id;
    if (discovered.length < 200 || !after) return;
  } while (true);
}

function nullableNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function mediaItem({ kind, position, sourceId = null, label, url = null, contentType = null, sizeBytes = null, width = null, height = null, description = null, isSpoiler = false }) {
  return {
    kind,
    position,
    sourceId,
    label: label || `${kind} ${position + 1}`,
    url,
    contentType,
    sizeBytes: nullableNumber(sizeBytes),
    width: nullableNumber(width),
    height: nullableNumber(height),
    description,
    isSpoiler: Boolean(isSpoiler),
  };
}

export function projectDiscordMessageMedia(message) {
  const attachments = collectionValues(message.attachments).map((attachment, position) => mediaItem({
    kind: 'attachment', position, sourceId: attachment.id ?? null,
    label: attachment.name ?? attachment.filename, url: attachment.url ?? null,
    contentType: attachment.contentType ?? null, sizeBytes: attachment.size,
    width: attachment.width, height: attachment.height,
    description: attachment.description ?? null, isSpoiler: attachment.spoiler,
  }));
  const embeds = collectionValues(message.embeds).map((embed, position) => mediaItem({
    kind: 'embed', position, label: embed.title ?? embed.provider?.name ?? 'Discord-Embed',
    url: embed.url ?? embed.thumbnail?.url ?? embed.image?.url ?? embed.video?.url ?? null,
    description: embed.description ?? null,
  }));
  const stickers = collectionValues(message.stickers).map((sticker, position) => mediaItem({
    kind: 'sticker', position, sourceId: sticker.id ?? null, label: sticker.name,
    url: sticker.url ?? null, description: sticker.description ?? null,
  }));
  return [...attachments, ...embeds, ...stickers];
}

function memberData(member, guildId) {
  return {
    guildId,
    userId: member.user.id,
    nickname: member.nickname ?? null,
    joinedAt: member.joinedAt ?? null,
    roleIds: collectionValues(member.roles?.cache).map((role) => role.id),
  };
}

async function recordObservations(dataRepository, sourceId, entityType, entityIds) {
  if (!sourceId || typeof dataRepository.recordSourceObservation !== 'function') return;
  for (const entityId of entityIds.filter(Boolean)) {
    await dataRepository.recordSourceObservation({ sourceId, entityType, entityId });
  }
}

async function syncGuild(dataRepository, guild, sourceId = null) {
  await dataRepository.upsertGuild({
    id: guild.id,
    name: guild.name,
    icon: guild.icon ?? null,
    ownerId: guild.ownerId ?? null,
  });

  const channels = [...guild.channels.cache.values()]
    .filter((channel) => channel.guildId === guild.id)
    .map((channel) => channelData(channel, guild.id));
  const roles = [...guild.roles.cache.values()].map((role) => roleData(role, guild.id));

  await dataRepository.replaceGuildChannels({ guildId: guild.id, channels, ...(sourceId ? { sourceId } : {}) });
  await dataRepository.replaceGuildRoles({ guildId: guild.id, roles, ...(sourceId ? { sourceId } : {}) });
  await recordObservations(dataRepository, sourceId, 'guild', [guild.id]);
  await recordObservations(dataRepository, sourceId, 'channel', channels.map((channel) => channel.id));
  await recordObservations(dataRepository, sourceId, 'role', roles.map((role) => role.id));

  const fetchedMembers = await guild.members.fetch();
  const members = collectionValues(fetchedMembers).map((member) => memberData(member, guild.id));
  for (const member of collectionValues(fetchedMembers)) await dataRepository.upsertUser(userData(member.user));
  await dataRepository.replaceGuildMembers({ guildId: guild.id, members, ...(sourceId ? { sourceId } : {}) });
  await recordObservations(dataRepository, sourceId, 'member', members.map((member) => `${member.guildId}:${member.userId}`));
  if (guild.scheduledEvents?.fetch) {
    const scheduledEvents = collectionValues(await guild.scheduledEvents.fetch());
    for (const event of scheduledEvents) await persistScheduledEvent(dataRepository, event, sourceId);
  }
  await dataRepository.recordGuildFullSync({ guildId: guild.id, syncedAt: new Date() });
}

function syncErrorMessage(error) {
  const message = String(error?.message || 'Unbekannter Discord-Synchronisationsfehler');
  return message
    .replace(/description:\s*"(?:\\.|[^"\\])*"/gs, 'description: "[REDACTED]"')
    .replace(/(token|authorization|password)\s*[:=]\s*\S+/gi, '$1=[REDACTED]')
    .slice(0, 500);
}

async function persistInboundMessage(dataRepository, message, sourceId = null) {
  const guildId = message.guild?.id ?? null;
  if (message.guild) {
    await dataRepository.upsertGuild({
      id: message.guild.id,
      name: message.guild.name,
      icon: message.guild.icon ?? null,
      ownerId: message.guild.ownerId ?? null,
    });
  }
  await dataRepository.upsertUser(userData(message.author));
  await dataRepository.upsertChannel(channelData(message.channel, guildId));
  await dataRepository.saveMessage({
    id: message.id,
    channelId: message.channel.id,
    guildId,
    authorId: message.author.id,
    content: normalizeDiscordMessageContent(message.content),
    media: projectDiscordMessageMedia(message),
    createdAt: message.createdAt,
  });
  if (sourceId && typeof dataRepository.recordSourceObservation === 'function') {
    await dataRepository.recordSourceObservation({ sourceId, entityType: 'message', entityId: message.id });
  }
}

const DISCORD_SCHEDULED_EVENT_STATUS_BY_NAME = Object.freeze({
  SCHEDULED: 1,
  ACTIVE: 2,
  COMPLETED: 3,
  CANCELED: 4,
  CANCELLED: 4,
});

const DISCORD_SCHEDULED_EVENT_ENTITY_TYPE_BY_NAME = Object.freeze({
  STAGE_INSTANCE: 1,
  VOICE: 2,
  EXTERNAL: 3,
});

function canonicalScheduledEventEnum(value, valuesByName) {
  if (Number.isInteger(value)) return value;
  if (typeof value === 'string' && Number.isInteger(valuesByName[value])) return valuesByName[value];
  const numeric = Number(value);
  return Number.isInteger(numeric) ? numeric : 0;
}

function scheduledEventData(event) {
  return {
    id: event.id,
    guildId: event.guildId ?? event.guild?.id,
    channelId: event.channelId ?? null,
    creatorId: event.creatorId ?? event.creator?.id ?? null,
    name: event.name ?? '',
    description: event.description ?? null,
    scheduledStartAt: event.scheduledStartAt ?? null,
    scheduledEndAt: event.scheduledEndAt ?? null,
    status: canonicalScheduledEventEnum(event.status, DISCORD_SCHEDULED_EVENT_STATUS_BY_NAME),
    entityType: canonicalScheduledEventEnum(event.entityType, DISCORD_SCHEDULED_EVENT_ENTITY_TYPE_BY_NAME),
    image: event.image ?? null,
  };
}

async function persistScheduledEvent(dataRepository, event, sourceId = null) {
  const projected = scheduledEventData(event);
  if (!projected.id || !projected.guildId) return;
  await dataRepository.upsertScheduledEvent(projected);
  if (sourceId && typeof dataRepository.recordSourceObservation === 'function') {
    await dataRepository.recordSourceObservation({ sourceId, entityType: 'scheduled_event', entityId: projected.id });
  }
}

function isTextBasedChannel(channel) {
  if (typeof channel?.isTextBased === 'function') return channel.isTextBased();
  if (typeof channel?.isText === 'function') return channel.isText();
  return false;
}

async function catchUpGuildMessages(dataRepository, guild, logger, sourceId = null) {
  for (const channel of guild.channels.cache.values()) {
    if (!isTextBasedChannel(channel) || !channel.messages?.fetch) continue;
    try {
      const messages = await channel.messages.fetch({ limit: 100 });
      for (const message of collectionValues(messages).reverse()) await persistInboundMessage(dataRepository, message, sourceId);
    } catch (error) {
      logger.error('Discord message catch-up failed', { guildId: guild.id, channelId: channel.id, message: syncErrorMessage(error) });
    }
  }
}

async function catchUpDirectMessages(dataRepository, client, logger, sourceId = null) {
  const channels = collectionValues(client.channels?.cache)
    .filter((channel) => channel?.type === 1 || channel?.type === 'DM' || channel?.isDMBased?.());

  for (const channel of channels) {
    if (!isTextBasedChannel(channel) || !channel.messages?.fetch) continue;
    try {
      const messages = await channel.messages.fetch({ limit: 100 });
      for (const message of collectionValues(messages).reverse()) await persistInboundMessage(dataRepository, message, sourceId);
    } catch (error) {
      logger.error('Discord direct-message catch-up failed', { channelId: channel.id, message: syncErrorMessage(error) });
    }
  }
}

/** Attach DB persistence to one discord.js client. Errors stay isolated to a single event. */
export function attachDiscordEventHandlers({ client, dataRepository, sourceId = null, settings = {}, logger = console, hydrateGuildCache: shouldHydrateGuildCache = false, setIntervalFn = setInterval, clearIntervalFn = clearInterval }) {
  if (!client || typeof client.on !== 'function') return () => {};
  let dailySyncTimer = null;
  const guildReconciliationQueues = new Map();
  const enqueueGuildReconciliation = (guildId, operation) => {
    const previous = guildReconciliationQueues.get(guildId) || Promise.resolve();
    const queued = previous.catch(() => {}).then(operation);
    const tracked = queued.finally(() => {
      if (guildReconciliationQueues.get(guildId) === tracked) guildReconciliationQueues.delete(guildId);
    });
    guildReconciliationQueues.set(guildId, tracked);
    return tracked;
  };

  const syncOneGuild = (guild) => enqueueGuildReconciliation(guild.id, async () => {
    logger.info?.('Discord guild full sync starting', { guildId: guild.id, sourceId });
    try {
      await syncGuild(dataRepository, guild, sourceId);
      logger.info?.('Discord guild full sync completed', { guildId: guild.id, sourceId });
    } catch (error) {
      const errorMessage = syncErrorMessage(error);
      try {
        await dataRepository.recordGuildFullSyncFailure({ guildId: guild.id, failedAt: new Date(), errorMessage });
      } catch (recordError) {
        logger.error('Discord full-sync failure state could not be saved', { guildId: guild.id, message: syncErrorMessage(recordError) });
      }
      logger.error('Discord guild full sync failed', { guildId: guild.id, message: errorMessage });
    }
  });

  const syncCachedGuilds = async () => {
    if (shouldHydrateGuildCache) {
      try {
        await hydrateGuildCache(client);
      } catch (error) {
        logger.error('Discord guild cache hydration failed', { message: syncErrorMessage(error) });
      }
    }
    for (const guild of client.guilds.cache.values()) await syncOneGuild(guild);
  };
  const syncMember = async (member) => {
    const guildId = member.guild?.id ?? member.guildId;
    if (!guildId || !member.user?.id) return;
    if (member.guild) {
      await dataRepository.upsertGuild({
        id: guildId,
        name: member.guild.name,
        icon: member.guild.icon ?? null,
        ownerId: member.guild.ownerId ?? null,
      });
    }
    const memberRoles = collectionValues(member.roles?.cache)
      .map((role) => member.guild?.roles?.cache?.get(role.id) ?? role)
      .filter((role) => role?.id && typeof role.name === 'string');
    for (const role of memberRoles) await dataRepository.upsertRole(roleData(role, guildId));
    await dataRepository.upsertUser(userData(member.user));
    await dataRepository.upsertGuildMember(memberData(member, guildId));
    await dataRepository.replaceGuildMemberRoles({
      guildId,
      userId: member.user.id,
      roleIds: memberRoles.map((role) => role.id),
    });
  };
  const safely = (operation, eventName) => (...args) => {
    Promise.resolve(operation(...args)).catch((error) => {
      logger.error(`Discord ${eventName} persistence failed`, { message: error?.message });
    });
  };

  client.on('guildCreate', safely((guild) => syncOneGuild(guild), 'guildCreate'));
  client.on('guildUpdate', safely((_oldGuild, guild) => enqueueGuildReconciliation(guild.id, () => dataRepository.upsertGuild({ id: guild.id, name: guild.name, icon: guild.icon ?? null, ownerId: guild.ownerId ?? null })), 'guildUpdate'));
  client.on('guildDelete', safely((guild) => enqueueGuildReconciliation(guild.id, () => dataRepository.deleteGuild(guild.id)), 'guildDelete'));
  client.on('channelCreate', safely((channel) => { const guildId = channel.guild?.id ?? channel.guildId ?? null; return guildId ? enqueueGuildReconciliation(guildId, () => dataRepository.upsertChannel(channelData(channel, guildId))) : dataRepository.upsertChannel(channelData(channel, null)); }, 'channelCreate'));
  client.on('channelUpdate', safely((_oldChannel, channel) => { const guildId = channel.guild?.id ?? channel.guildId ?? null; return guildId ? enqueueGuildReconciliation(guildId, () => dataRepository.upsertChannel(channelData(channel, guildId))) : dataRepository.upsertChannel(channelData(channel, null)); }, 'channelUpdate'));
  client.on('channelDelete', safely((channel) => { const guildId = channel.guild?.id ?? channel.guildId ?? null; return guildId ? enqueueGuildReconciliation(guildId, () => dataRepository.deleteChannel(channel.id)) : dataRepository.deleteChannel(channel.id); }, 'channelDelete'));
  client.on('roleCreate', safely((role) => enqueueGuildReconciliation(role.guild.id, () => dataRepository.upsertRole(roleData(role, role.guild.id))), 'roleCreate'));
  client.on('roleUpdate', safely((_oldRole, role) => enqueueGuildReconciliation(role.guild.id, () => dataRepository.upsertRole(roleData(role, role.guild.id))), 'roleUpdate'));
  client.on('roleDelete', safely((role) => enqueueGuildReconciliation(role.guild.id, () => dataRepository.deleteRole(role.id)), 'roleDelete'));
  client.on('guildMemberAdd', safely((member) => enqueueGuildReconciliation(member.guild.id, () => syncMember(member)), 'guildMemberAdd'));
  client.on('guildMemberUpdate', safely((_oldMember, member) => enqueueGuildReconciliation(member.guild.id, () => syncMember(member)), 'guildMemberUpdate'));
  client.on('guildMemberRemove', safely((member) => enqueueGuildReconciliation(member.guild.id, () => dataRepository.removeGuildMember({ guildId: member.guild.id, userId: member.user.id })), 'guildMemberRemove'));
  client.on('guildScheduledEventCreate', safely((event) => persistScheduledEvent(dataRepository, event, sourceId), 'guildScheduledEventCreate'));
  client.on('guildScheduledEventUpdate', safely((_oldEvent, event) => persistScheduledEvent(dataRepository, event, sourceId), 'guildScheduledEventUpdate'));
  client.on('guildScheduledEventDelete', safely((event) => sourceId && typeof dataRepository.removeSourceObservation === 'function'
    ? dataRepository.removeSourceObservation({ sourceId, entityType: 'scheduled_event', entityId: event.id })
    : dataRepository.deleteScheduledEvent(event.id), 'guildScheduledEventDelete'));

  let initialSyncStarted = false;
  const handleClientReady = safely(async () => {
    if (initialSyncStarted) return;
    initialSyncStarted = true;
    await syncCachedGuilds();
    if (settings.listenMessages) {
      for (const guild of client.guilds.cache.values()) await catchUpGuildMessages(dataRepository, guild, logger, sourceId);
      await catchUpDirectMessages(dataRepository, client, logger, sourceId);
    }
    if (!dailySyncTimer) {
      dailySyncTimer = setIntervalFn(() => syncCachedGuilds().catch((error) => logger.error('Discord daily guild sync failed', { message: error?.message })), 24 * 60 * 60 * 1000);
      dailySyncTimer.unref?.();
    }
  }, 'ready');
  client.once('clientReady', handleClientReady);
  client.once('ready', handleClientReady);

  if (settings.listenMessages) {
    client.on('messageCreate', safely((message) => persistInboundMessage(dataRepository, message, sourceId), 'messageCreate'));
  }

  return () => {
    if (dailySyncTimer) clearIntervalFn(dailySyncTimer);
    dailySyncTimer = null;
  };
}
