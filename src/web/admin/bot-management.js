const BOT_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{2,63}$/;
const MIN_TOKEN_LENGTH = 20;

function validateBotId(botId) {
  const cleanBotId = String(botId || "").trim();
  if (!BOT_ID_PATTERN.test(cleanBotId)) {
    throw new TypeError("bot_id must contain 3–64 letters, digits, underscores, or hyphens");
  }
  return cleanBotId;
}

function validateToken(token) {
  const cleanToken = String(token || "").trim();
  if (cleanToken.length < MIN_TOKEN_LENGTH) {
    throw new TypeError("Token must contain at least 20 characters");
  }
  return cleanToken;
}

export function parseBotSettings(settingsInput) {
  let parsed;
  try {
    parsed = JSON.parse(String(settingsInput || "{}"));
  } catch {
    throw new TypeError("Settings must be valid JSON");
  }
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new TypeError("Settings must be a JSON object");
  }

  for (const [key, value] of Object.entries(parsed)) {
    if (!['allowCommands', 'allowReports', 'listenMessages'].includes(key) || typeof value !== 'boolean') {
      throw new TypeError("Settings allow only boolean allowCommands, allowReports, and listenMessages values");
    }
  }
  return parsed;
}

function booleanDiff(before = {}, after = {}) {
  const changes = {};
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (before[key] !== after[key]) changes[key] = { from: before[key], to: after[key] };
  }
  return changes;
}

export async function createBotRegistration({ prisma, actorId = null, botId, token, settingsInput }) {
  const data = {
    botId: validateBotId(botId),
    token: validateToken(token),
    settings: parseBotSettings(settingsInput),
    isActive: true,
  };
  if (!actorId) return prisma.discordBotRegistration.create({ data });
  return prisma.$transaction(async (tx) => {
    const saved = await tx.discordBotRegistration.create({ data });
    await tx.discordBotAdminAudit.create({
      data: { botId: data.botId, actorId: String(actorId), action: 'created', details: { isActive: true, capabilities: data.settings, tokenRotated: true } },
    });
    return saved;
  });
}

export async function updateBotRegistration({ prisma, actorId = null, botId, isActive, token, settingsInput }) {
  const settings = parseBotSettings(settingsInput);
  const data = { isActive: Boolean(isActive), settings };
  const tokenRotated = Boolean(String(token || "").trim());
  if (tokenRotated) {
    data.token = validateToken(token);
    data.rotatedAt = new Date();
  }
  const cleanBotId = validateBotId(botId);
  if (!actorId) return prisma.discordBotRegistration.update({ where: { botId: cleanBotId }, data });

  return prisma.$transaction(async (tx) => {
    const previous = await tx.discordBotRegistration.findUnique({ where: { botId: cleanBotId }, select: { isActive: true, settings: true } });
    const saved = await tx.discordBotRegistration.update({ where: { botId: cleanBotId }, data });
    await tx.discordBotAdminAudit.create({
      data: {
        botId: cleanBotId,
        actorId: String(actorId),
        action: 'updated',
        details: {
          isActive: previous?.isActive === Boolean(isActive) ? undefined : { from: previous?.isActive, to: Boolean(isActive) },
          capabilities: booleanDiff(previous?.settings || {}, settings),
          tokenRotated,
        },
      },
    });
    return saved;
  });
}

export function publicBotRegistration(record, runtimeStatus = {}) {
  return {
    botId: record.botId,
    settings: record.settings,
    discordUserId: record.discordUserId,
    isActive: record.isActive,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    audits: Array.isArray(record.audits) ? record.audits.map((audit) => ({
      actorId: audit.actorId,
      action: audit.action,
      details: audit.details,
      createdAt: audit.createdAt,
    })) : [],
    online: Boolean(runtimeStatus.online),
    ready: Boolean(runtimeStatus.ready),
  };
}
