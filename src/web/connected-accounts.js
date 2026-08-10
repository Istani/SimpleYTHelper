import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export const DISCORD_OAUTH_SCOPES = ['identify', 'guilds'];

function encryptionKey(key) {
  let decoded;
  try { decoded = Buffer.from(String(key), 'base64'); } catch { throw new Error('OAuth-Verschlüsselungsschlüssel ist ungültig'); }
  if (decoded.length !== 32) throw new Error('OAUTH_TOKEN_ENCRYPTION_KEY muss Base64-kodiert genau 32 Byte enthalten');
  return decoded;
}

export function encryptToken(token, key) {
  if (!token || typeof token !== 'string') throw new Error('OAuth-Token fehlt');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(key), iv);
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64url');
}

export function decryptToken(value, key) {
  try {
    const payload = Buffer.from(String(value), 'base64url');
    if (payload.length < 29) throw new Error('zu kurz');
    const decipher = createDecipheriv('aes-256-gcm', encryptionKey(key), payload.subarray(0, 12));
    decipher.setAuthTag(payload.subarray(12, 28));
    return Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()]).toString('utf8');
  } catch { throw new Error('OAuth-Token-Chiffretext ist ungültig'); }
}

export function buildDiscordAuthorizationUrl({ clientId, redirectUri, state }) {
  if (!clientId || !redirectUri || !state) throw new Error('Discord-OAuth-Konfiguration ist unvollständig');
  const url = new URL('https://discord.com/oauth2/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', DISCORD_OAUTH_SCOPES.join(' '));
  url.searchParams.set('state', state);
  return url.toString();
}

export function publicConnectedAccount(account) {
  return {
    id: account.id,
    provider: account.provider,
    providerAccountId: account.providerAccountId,
    displayName: account.displayName,
    avatarUrl: account.avatarUrl,
    scopes: account.scopes,
    tokenExpiresAt: account.tokenExpiresAt,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

export async function persistDiscordAccount({ prisma, webUserId, profile, token, encryptionKey: key }) {
  if (!webUserId || !profile?.id || !token?.access_token) throw new Error('Discord-Kontodaten sind unvollständig');
  const expiresIn = Number(token.expires_in);
  const tokenExpiresAt = Number.isFinite(expiresIn) && expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000) : null;
  const displayName = String(profile.global_name || profile.username || profile.id);
  const avatarUrl = profile.avatar ? `https://cdn.discordapp.com/avatars/${encodeURIComponent(profile.id)}/${encodeURIComponent(profile.avatar)}.png` : null;
  const data = {
    displayName,
    avatarUrl,
    accessTokenCiphertext: encryptToken(token.access_token, key),
    refreshTokenCiphertext: token.refresh_token ? encryptToken(token.refresh_token, key) : null,
    tokenExpiresAt,
    scopes: String(token.scope || '').split(/\s+/).filter(Boolean),
  };
  const account = await prisma.connectedAccount.upsert({
    where: { webUserId_provider_providerAccountId: { webUserId, provider: 'discord', providerAccountId: String(profile.id) } },
    create: { webUserId, provider: 'discord', providerAccountId: String(profile.id), ...data },
    update: data,
  });
  return publicConnectedAccount(account);
}
