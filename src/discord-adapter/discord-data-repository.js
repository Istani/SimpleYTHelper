export function createDiscordDataRepository({ prisma }) {
  if (!prisma) {
    throw new TypeError('prisma client is required');
  }

  return {
    async upsertGuild({ id, name, icon, ownerId }) {
      return prisma.discordGuild.upsert({
        where: { id },
        create: { id, name, icon, ownerId },
        update: { name, icon, ownerId },
      });
    },

    async upsertUser({ id, username, discriminator, globalName, avatar, isBot }) {
      return prisma.discordUser.upsert({
        where: { id },
        create: { id, username, discriminator, globalName, avatar, isBot: !!isBot },
        update: { username, discriminator, globalName, avatar, isBot: !!isBot },
      });
    },

    async upsertChannel({ id, guildId, name, type, topic, position, parentId }) {
      return prisma.discordChannel.upsert({
        where: { id },
        create: { id, guildId, name, type, topic, position: position ?? 0, parentId },
        update: { guildId, name, type, topic, position: position ?? 0, parentId },
      });
    },

    async upsertRole({ id, guildId, name, color, hoist, position, permissions, managed, mentionable }) {
      return prisma.discordRole.upsert({
        where: { id },
        create: {
          id,
          guildId,
          name,
          color: color ?? 0,
          hoist: !!hoist,
          position: position ?? 0,
          permissions: String(permissions),
          managed: !!managed,
          mentionable: !!mentionable,
        },
        update: {
          guildId,
          name,
          color: color ?? 0,
          hoist: !!hoist,
          position: position ?? 0,
          permissions: String(permissions),
          managed: !!managed,
          mentionable: !!mentionable,
        },
      });
    },

    async saveMessage({ id, channelId, guildId, authorId, content, createdAt }) {
      return prisma.discordMessage.upsert({
        where: { id },
        create: {
          id,
          channelId,
          guildId,
          authorId,
          content,
          createdAt: createdAt ? new Date(createdAt) : new Date(),
        },
        update: {
          content,
        },
      });
    },

    async upsertGuildMember({ guildId, userId, nickname, joinedAt }) {
      return prisma.discordGuildMember.upsert({
        where: { guildId_userId: { guildId, userId } },
        create: { guildId, userId, nickname, joinedAt: joinedAt ? new Date(joinedAt) : null },
        update: { nickname, joinedAt: joinedAt ? new Date(joinedAt) : undefined },
      });
    },

    async assignMemberRole({ guildId, userId, roleId }) {
      return prisma.discordMemberRole.upsert({
        where: { guildId_userId_roleId: { guildId, userId, roleId } },
        create: { guildId, userId, roleId },
        update: {},
      });
    },

    async removeMemberRole({ guildId, userId, roleId }) {
      try {
        return await prisma.discordMemberRole.delete({
          where: { guildId_userId_roleId: { guildId, userId, roleId } },
        });
      } catch {
        return null;
      }
    },
  };
}
