import { unemojify } from 'node-emoji';

export function normalizeDiscordMessageContent(content) {
  return unemojify(String(content ?? ''));
}

function channelData(channel, guildId) {
  return {
    id: channel.id,
    guildId,
    name: channel.name ?? '',
    type: channel.type,
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

async function syncGuild(dataRepository, guild) {
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

  await dataRepository.bulkUpsertChannels(channels);
  await dataRepository.bulkUpsertRoles(roles);

  const fetchedMembers = await guild.members.fetch();
  const members = collectionValues(fetchedMembers).map((member) => memberData(member, guild.id));
  for (const member of collectionValues(fetchedMembers)) await dataRepository.upsertUser(userData(member.user));
  await dataRepository.replaceGuildMembers({ guildId: guild.id, members });
  await dataRepository.recordGuildFullSync({ guildId: guild.id, syncedAt: new Date() });
}

function syncErrorMessage(error) {
  const message = String(error?.message || 'Unbekannter Discord-Synchronisationsfehler');
  return message.replace(/(token|authorization|password)\s*[:=]\s*\S+/gi, '$1=[REDACTED]').slice(0, 500);
}

/** Attach DB persistence to one discord.js client. Errors stay isolated to a single event. */
export function attachDiscordEventHandlers({ client, dataRepository, settings = {}, logger = console, setIntervalFn = setInterval, clearIntervalFn = clearInterval }) {
  if (!client || typeof client.on !== 'function') return () => {};
  let dailySyncTimer = null;

  const syncOneGuild = async (guild) => {
    try {
      await syncGuild(dataRepository, guild);
    } catch (error) {
      const errorMessage = syncErrorMessage(error);
      try {
        await dataRepository.recordGuildFullSyncFailure({ guildId: guild.id, failedAt: new Date(), errorMessage });
      } catch (recordError) {
        logger.error('Discord full-sync failure state could not be saved', { guildId: guild.id, message: syncErrorMessage(recordError) });
      }
      logger.error('Discord guild full sync failed', { guildId: guild.id, message: errorMessage });
    }
  };

  const syncCachedGuilds = async () => {
    for (const guild of client.guilds.cache.values()) await syncOneGuild(guild);
  };
  const safely = (operation, eventName) => (...args) => {
    Promise.resolve(operation(...args)).catch((error) => {
      logger.error(`Discord ${eventName} persistence failed`, { message: error?.message });
    });
  };

  client.on('guildCreate', safely((guild) => syncOneGuild(guild), 'guildCreate'));

  client.on('clientReady', safely(async () => {
    await syncCachedGuilds();
    if (!dailySyncTimer) {
      dailySyncTimer = setIntervalFn(() => syncCachedGuilds().catch((error) => logger.error('Discord daily guild sync failed', { message: error?.message })), 24 * 60 * 60 * 1000);
      dailySyncTimer.unref?.();
    }
  }, 'clientReady'));

  if (settings.listenMessages) {
    client.on('messageCreate', safely(async (message) => {
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
    }, 'messageCreate'));
  }

  return () => {
    if (dailySyncTimer) clearIntervalFn(dailySyncTimer);
    dailySyncTimer = null;
  };
}
