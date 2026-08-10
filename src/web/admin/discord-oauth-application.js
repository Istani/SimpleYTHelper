import { decryptToken, encryptToken } from '../connected-accounts.js';

const PROVIDER = 'discord';

function validateClientId(value) {
  const clientId = String(value || '').trim();
  if (!/^[0-9]{10,30}$/.test(clientId)) throw new TypeError('Die Discord Client-ID muss eine gültige numerische ID sein.');
  return clientId;
}

function validateRedirectUri(value) {
  let url;
  try { url = new URL(String(value || '').trim()); } catch { throw new TypeError('Die Discord Callback-URL ist ungültig.'); }
  const local = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) throw new TypeError('Die Discord Callback-URL muss außerhalb lokaler Entwicklung HTTPS verwenden.');
  if (url.pathname !== '/api/connections/discord/callback') throw new TypeError('Die Discord Callback-URL muss auf /api/connections/discord/callback enden.');
  return url.toString();
}

function validateClientSecret(value) {
  const secret = String(value || '').trim();
  if (secret.length < 8) throw new TypeError('Das Discord Client-Secret muss mindestens 8 Zeichen enthalten.');
  return secret;
}

export function publicDiscordOAuthApplication(record) {
  return {
    provider: record.provider,
    clientId: record.clientId,
    redirectUri: record.redirectUri,
    isActive: record.isActive,
    rotatedAt: record.rotatedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    configured: Boolean(record.clientSecretCiphertext),
  };
}

export async function saveDiscordOAuthApplication({ prisma, clientId, clientSecret, redirectUri, isActive, encryptionKey }) {
  const existing = await prisma.oauthProviderConfiguration.findUnique({ where: { provider: PROVIDER } });
  const cleanSecret = String(clientSecret || '').trim();
  if (!existing && !cleanSecret) throw new TypeError('Ein Discord Client-Secret ist beim ersten Speichern erforderlich.');
  const clientSecretCiphertext = cleanSecret ? encryptToken(validateClientSecret(cleanSecret), encryptionKey) : existing.clientSecretCiphertext;
  const data = { clientId: validateClientId(clientId), clientSecretCiphertext, redirectUri: validateRedirectUri(redirectUri), isActive: Boolean(isActive), rotatedAt: cleanSecret ? new Date() : existing?.rotatedAt ?? null };
  const saved = await prisma.oauthProviderConfiguration.upsert({ where: { provider: PROVIDER }, create: { provider: PROVIDER, ...data }, update: data });
  return publicDiscordOAuthApplication(saved);
}

export async function loadDiscordOAuthApplication(prisma, encryptionKey) {
  const record = await prisma.oauthProviderConfiguration.findUnique({ where: { provider: PROVIDER } });
  if (!record?.isActive || !record.clientSecretCiphertext) return null;
  return { clientId: record.clientId, clientSecret: decryptToken(record.clientSecretCiphertext, encryptionKey), redirectUri: record.redirectUri };
}
