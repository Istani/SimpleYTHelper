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

    async bulkUpsertChannels(channels) {
      if (!channels || channels.length === 0) return [];
      return prisma.$transaction(
        channels.map((ch) =>
          prisma.discordChannel.upsert({
            where: { id: ch.id },
            create: { id: ch.id, guildId: ch.guildId, name: ch.name, type: ch.type, topic: ch.topic, position: ch.position ?? 0, parentId: ch.parentId },
            update: { guildId: ch.guildId, name: ch.name, type: ch.type, topic: ch.topic, position: ch.position ?? 0, parentId: ch.parentId },
          })
        )
      );
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

    async bulkUpsertRoles(roles) {
      if (!roles || roles.length === 0) return [];
      return prisma.$transaction(
        roles.map((r) =>
          prisma.discordRole.upsert({
            where: { id: r.id },
            create: {
              id: r.id,
              guildId: r.guildId,
              name: r.name,
              color: r.color ?? 0,
              hoist: !!r.hoist,
              position: r.position ?? 0,
              permissions: String(r.permissions),
              managed: !!r.managed,
              mentionable: !!r.mentionable,
            },
            update: {
              guildId: r.guildId,
              name: r.name,
              color: r.color ?? 0,
              hoist: !!r.hoist,
              position: r.position ?? 0,
              permissions: String(r.permissions),
              managed: !!r.managed,
              mentionable: !!r.mentionable,
            },
          })
        )
      );
    },

    async saveMessage({ id, channelId, guildId, authorId, content, media = [], createdAt }) {
      const message = prisma.discordMessage.upsert({
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
      const replaceMedia = prisma.discordMessageMedia.deleteMany({ where: { messageId: id } });
      const createMedia = prisma.discordMessageMedia.createMany({
        data: media.map((item) => ({ ...item, messageId: id })),
      });
      const [savedMessage] = await prisma.$transaction([message, replaceMedia, createMedia]);
      return savedMessage;
    },

    async replaceGuildMembers({ guildId, members }) {
      const snapshot = Array.isArray(members) ? members : [];
      const userIds = snapshot.map((member) => member.userId);
      const memberRoles = snapshot.flatMap((member) => (member.roleIds || []).map((roleId) => ({ guildId, userId: member.userId, roleId })));
      const operations = [
        prisma.discordMemberRole.deleteMany({ where: { guildId } }),
        prisma.discordGuildMember.deleteMany({ where: { guildId, userId: { notIn: userIds } } }),
        ...snapshot.map((member) => prisma.discordGuildMember.upsert({
          where: { guildId_userId: { guildId, userId: member.userId } },
          create: { guildId, userId: member.userId, nickname: member.nickname ?? null, joinedAt: member.joinedAt ? new Date(member.joinedAt) : null },
          update: { nickname: member.nickname ?? null, joinedAt: member.joinedAt ? new Date(member.joinedAt) : null },
        })),
      ];
      if (memberRoles.length > 0) operations.push(prisma.discordMemberRole.createMany({ data: memberRoles }));
      return prisma.$transaction(operations);
    },

    async recordGuildFullSync({ guildId, syncedAt }) {
      return prisma.discordGuild.update({
        where: { id: guildId },
        data: { lastFullSyncAt: new Date(syncedAt), lastFullSyncFailedAt: null, lastFullSyncError: null },
      });
    },

    async recordGuildFullSyncFailure({ guildId, failedAt, errorMessage }) {
      return prisma.discordGuild.update({
        where: { id: guildId },
        data: { lastFullSyncFailedAt: new Date(failedAt), lastFullSyncError: String(errorMessage).slice(0, 500) },
      });
    },

    async upsertGuildMember({ guildId, userId, nickname, joinedAt }) {
      return prisma.discordGuildMember.upsert({
        where: { guildId_userId: { guildId, userId } },
        create: { guildId, userId, nickname, joinedAt: joinedAt ? new Date(joinedAt) : null },
        update: { nickname, joinedAt: joinedAt ? new Date(joinedAt) : undefined },
      });
    },

    async bulkUpsertMembers(members) {
      if (!members || members.length === 0) return [];
      return prisma.$transaction(
        members.map((m) =>
          prisma.discordGuildMember.upsert({
            where: { guildId_userId: { guildId: m.guildId, userId: m.userId } },
            create: { guildId: m.guildId, userId: m.userId, nickname: m.nickname, joinedAt: m.joinedAt ? new Date(m.joinedAt) : null },
            update: { nickname: m.joinedAt ? new Date(m.joinedAt) : undefined },
          })
        )
      );
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
