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
}

/** Attach DB persistence to one discord.js client. Errors stay isolated to a single event. */
export function attachDiscordEventHandlers({ client, dataRepository, settings = {}, logger = console }) {
  if (!client || typeof client.on !== 'function') return;

  const safely = (operation, eventName) => (...args) => {
    Promise.resolve(operation(...args)).catch((error) => {
      logger.error(`Discord ${eventName} persistence failed`, { message: error?.message });
    });
  };

  client.on('guildCreate', safely((guild) => syncGuild(dataRepository, guild), 'guildCreate'));

  client.on('ready', safely(async () => {
    for (const guild of client.guilds.cache.values()) await syncGuild(dataRepository, guild);
  }, 'ready'));

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
        createdAt: message.createdAt,
      });
    }, 'messageCreate'));
  }
}
