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

export async function createBotRegistration({ prisma, botId, token, settingsInput }) {
  const data = {
    botId: validateBotId(botId),
    token: validateToken(token),
    settings: parseBotSettings(settingsInput),
    isActive: true,
  };
  return prisma.discordBotRegistration.create({ data });
}

export async function updateBotRegistration({ prisma, botId, isActive, token, settingsInput }) {
  const data = {
    isActive: Boolean(isActive),
    settings: parseBotSettings(settingsInput),
  };
  if (String(token || "").trim()) {
    data.token = validateToken(token);
    data.rotatedAt = new Date();
  }
  return prisma.discordBotRegistration.update({
    where: { botId: validateBotId(botId) },
    data,
  });
}

export function publicBotRegistration(record) {
  return {
    botId: record.botId,
    settings: record.settings,
    discordUserId: record.discordUserId,
    isActive: record.isActive,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
