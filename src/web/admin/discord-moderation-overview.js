import { sortDirectMessagesByLatestMessage } from './discord-dm-presentation.js';
import { partitionGuildsByObservedAccounts } from './discord-guild-source-presentation.js';

export async function loadDiscordModerationOverview(prisma) {
  const [guilds, dms, observations] = await Promise.all([
    prisma.discordGuild.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { messages: true } } } }),
    prisma.discordChannel.findMany({ where: { guildId: null, type: { in: [1, 3] } }, include: { _count: { select: { messages: true } }, messages: { take: 1, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }, participants: { include: { user: { select: { id: true, username: true, globalName: true, avatar: true } } } } } }).then(sortDirectMessagesByLatestMessage),
    prisma.discordSourceObservation.findMany({ where: { entityType: 'guild' }, include: { source: { select: { botId: true, discordUserId: true, accountKind: true } } } }),
  ]);
  const accountIds = [...new Set(observations.map(({ source }) => source?.discordUserId).filter(Boolean))];
  const users = accountIds.length ? await prisma.discordUser.findMany({ where: { id: { in: accountIds } }, select: { id: true, username: true, globalName: true } }) : [];
  const usersById = new Map(users.map((user) => [user.id, user]));
  const resolvedObservations = observations.map((observation) => ({ ...observation, source: { ...observation.source, accountUser: usersById.get(observation.source.discordUserId) || null } }));
  return { guildGroups: partitionGuildsByObservedAccounts(guilds, resolvedObservations), dms };
}
