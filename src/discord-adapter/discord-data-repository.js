const SNAPSHOT_BATCH_SIZE = 5;

async function runBatches(_prisma, values, makeOperation) {
  const results = [];
  for (const value of values) results.push(await makeOperation(value));
  return results;
}

export function createDiscordDataRepository({ prisma }) {
  if (!prisma) {
    throw new TypeError('prisma client is required');
  }

  return {
    async upsertGuild({ id, name, icon, ownerId }) {
      return prisma.discordGuild.upsert({
        where: { id },
        create: { id, name, icon, ownerId, deletedAt: null },
        update: { name, icon, ownerId, deletedAt: null },
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
        create: { id, guildId, name, type, topic, position: position ?? 0, parentId, deletedAt: null },
        update: { guildId, name, type, topic, position: position ?? 0, parentId, deletedAt: null },
      });
    },

    async replaceGuildChannels({ guildId, channels, sourceId = null }) {
      const snapshot = Array.isArray(channels) ? channels : [];
      const channelIds = snapshot.map((channel) => channel.id);
      if (!sourceId) {
        await prisma.discordChannel.updateMany({ where: { guildId, id: { notIn: channelIds }, deletedAt: null }, data: { deletedAt: new Date() } });
      }
      return runBatches(prisma, snapshot, (channel) => prisma.discordChannel.upsert({
        where: { id: channel.id },
        create: { id: channel.id, guildId, name: channel.name, type: channel.type, topic: channel.topic, position: channel.position ?? 0, parentId: channel.parentId, deletedAt: null },
        update: { guildId, name: channel.name, type: channel.type, topic: channel.topic, position: channel.position ?? 0, parentId: channel.parentId, deletedAt: null },
      }));
    },

    async bulkUpsertChannels(channels) {
      if (!channels || channels.length === 0) return [];
      return prisma.$transaction(
        channels.map((ch) =>
          prisma.discordChannel.upsert({
            where: { id: ch.id },
            create: { id: ch.id, guildId: ch.guildId, name: ch.name, type: ch.type, topic: ch.topic, position: ch.position ?? 0, parentId: ch.parentId, deletedAt: null },
            update: { guildId: ch.guildId, name: ch.name, type: ch.type, topic: ch.topic, position: ch.position ?? 0, parentId: ch.parentId, deletedAt: null },
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
          deletedAt: null,
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
          deletedAt: null,
        },
      });
    },

    async replaceGuildRoles({ guildId, roles, sourceId = null }) {
      const snapshot = Array.isArray(roles) ? roles : [];
      const roleIds = snapshot.map((role) => role.id);
      if (!sourceId) {
        await prisma.discordRole.updateMany({ where: { guildId, id: { notIn: roleIds }, deletedAt: null }, data: { deletedAt: new Date() } });
      }
      return runBatches(prisma, snapshot, (role) => prisma.discordRole.upsert({
        where: { id: role.id },
        create: { id: role.id, guildId, name: role.name, color: role.color ?? 0, hoist: !!role.hoist, position: role.position ?? 0, permissions: String(role.permissions), managed: !!role.managed, mentionable: !!role.mentionable, deletedAt: null },
        update: { guildId, name: role.name, color: role.color ?? 0, hoist: !!role.hoist, position: role.position ?? 0, permissions: String(role.permissions), managed: !!role.managed, mentionable: !!role.mentionable, deletedAt: null },
      }));
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
              deletedAt: null,
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
              deletedAt: null,
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

    async upsertScheduledEvent({ id, guildId, channelId, creatorId, name, description, scheduledStartAt, scheduledEndAt, status, entityType, image }) {
      return prisma.discordScheduledEvent.upsert({
        where: { id },
        create: { id, guildId, channelId, creatorId, name, description, scheduledStartAt: scheduledStartAt ? new Date(scheduledStartAt) : null, scheduledEndAt: scheduledEndAt ? new Date(scheduledEndAt) : null, status, entityType, image, deletedAt: null },
        update: { guildId, channelId, creatorId, name, description, scheduledStartAt: scheduledStartAt ? new Date(scheduledStartAt) : null, scheduledEndAt: scheduledEndAt ? new Date(scheduledEndAt) : null, status, entityType, image, deletedAt: null },
      });
    },

    async deleteScheduledEvent(id) {
      return prisma.discordScheduledEvent.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
    },

    async recordSourceObservation({ sourceId, entityType, entityId }) {
      const observedAt = new Date();
      return prisma.discordSourceObservation.upsert({
        where: { sourceId_entityType_entityId: { sourceId, entityType, entityId } },
        create: { sourceId, entityType, entityId, observedAt, createdAt: observedAt, updatedAt: observedAt },
        update: { observedAt, updatedAt: observedAt },
      });
    },

    async removeSourceObservation({ sourceId, entityType, entityId }) {
      return prisma.discordSourceObservation.deleteMany({ where: { sourceId, entityType, entityId } });
    },

    async replaceGuildMembers({ guildId, members, sourceId = null }) {
      const snapshot = Array.isArray(members) ? members : [];
      const userIds = snapshot.map((member) => member.userId);
      const memberRoles = snapshot.flatMap((member) => (member.roleIds || []).map((roleId) => ({ guildId, userId: member.userId, roleId })));
      await prisma.discordMemberRole.deleteMany({ where: { guildId, userId: { in: userIds } } });
      if (!sourceId) {
        await prisma.discordGuildMember.updateMany({ where: { guildId, userId: { notIn: userIds }, deletedAt: null }, data: { deletedAt: new Date() } });
      }
      const savedMembers = await runBatches(prisma, snapshot, (member) => prisma.discordGuildMember.upsert({
        where: { guildId_userId: { guildId, userId: member.userId } },
        create: { guildId, userId: member.userId, nickname: member.nickname ?? null, joinedAt: member.joinedAt ? new Date(member.joinedAt) : null, deletedAt: null },
        update: { nickname: member.nickname ?? null, joinedAt: member.joinedAt ? new Date(member.joinedAt) : null, deletedAt: null },
      }));
      for (let start = 0; start < memberRoles.length; start += SNAPSHOT_BATCH_SIZE) {
        await prisma.$transaction([prisma.discordMemberRole.createMany({ data: memberRoles.slice(start, start + SNAPSHOT_BATCH_SIZE) })]);
      }
      return savedMembers;
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
        create: { guildId, userId, nickname, joinedAt: joinedAt ? new Date(joinedAt) : null, deletedAt: null },
        update: { nickname, joinedAt: joinedAt ? new Date(joinedAt) : undefined, deletedAt: null },
      });
    },

    async bulkUpsertMembers(members) {
      if (!members || members.length === 0) return [];
      return prisma.$transaction(
        members.map((m) =>
          prisma.discordGuildMember.upsert({
            where: { guildId_userId: { guildId: m.guildId, userId: m.userId } },
            create: { guildId: m.guildId, userId: m.userId, nickname: m.nickname ?? null, joinedAt: m.joinedAt ? new Date(m.joinedAt) : null, deletedAt: null },
            update: { nickname: m.nickname ?? null, joinedAt: m.joinedAt ? new Date(m.joinedAt) : undefined, deletedAt: null },
          })
        )
      );
    },

    async replaceGuildMemberRoles({ guildId, userId, roleIds = [] }) {
      const uniqueRoleIds = Array.from(new Set(roleIds));
      const operations = [
        prisma.discordMemberRole.deleteMany({ where: { guildId, userId } }),
      ];
      if (uniqueRoleIds.length > 0) {
        operations.push(prisma.discordMemberRole.createMany({
          data: uniqueRoleIds.map((roleId) => ({ guildId, userId, roleId })),
        }));
      }
      return prisma.$transaction(operations);
    },

    async removeGuildMember({ guildId, userId }) {
      return prisma.discordGuildMember.updateMany({ where: { guildId, userId, deletedAt: null }, data: { deletedAt: new Date() } });
    },

    async deleteChannel(channelId) {
      return prisma.discordChannel.updateMany({ where: { id: channelId, deletedAt: null }, data: { deletedAt: new Date() } });
    },

    async deleteRole(roleId) {
      return prisma.discordRole.updateMany({ where: { id: roleId, deletedAt: null }, data: { deletedAt: new Date() } });
    },

    async deleteGuild(guildId) {
      return prisma.discordGuild.updateMany({ where: { id: guildId, deletedAt: null }, data: { deletedAt: new Date() } });
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
