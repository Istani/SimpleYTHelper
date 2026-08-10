import { NextResponse } from 'next/server';
import { getSession, verifyDiscordOAuthState, discordOAuthStateCookie } from '../../../../../src/web/auth/session.js';
import { getWebPrisma } from '../../../../../src/web/auth/users.js';
import { persistDiscordAccount } from '../../../../../src/web/connected-accounts.js';

function appUrl(path) {
  return new URL(path, process.env.DISCORD_OAUTH_REDIRECT_URI || 'http://localhost');
}

async function exchangeCode(code) {
  const clientId = process.env.DISCORD_OAUTH_CLIENT_ID;
  const clientSecret = process.env.DISCORD_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_OAUTH_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) throw new Error('Discord OAuth ist nicht konfiguriert');
  const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: 'authorization_code', code, redirect_uri: redirectUri }),
    cache: 'no-store',
  });
  if (!tokenResponse.ok) throw new Error('Discord-Code konnte nicht eingelöst werden');
  const token = await tokenResponse.json();
  if (!token?.access_token) throw new Error('Discord lieferte keinen Zugriffstoken');
  const profileResponse = await fetch('https://discord.com/api/v10/users/@me', {
    headers: { Authorization: `Bearer ${token.access_token}` },
    cache: 'no-store',
  });
  if (!profileResponse.ok) throw new Error('Discord-Profil konnte nicht geladen werden');
  return { token, profile: await profileResponse.json() };
}

export async function GET(request) {
  const session = await getSession();
  const url = new URL(request.url);
  const state = url.searchParams.get('state');
  const code = url.searchParams.get('code');
  const cookieState = request.cookies.get(discordOAuthStateCookie.name)?.value;
  const response = (status) => {
    const redirect = NextResponse.redirect(appUrl(`/connections?discord=${status}`));
    redirect.cookies.set(discordOAuthStateCookie.name, '', { ...discordOAuthStateCookie.options, maxAge: 0 });
    return redirect;
  };

  if (!session?.sub || !code || !state || !cookieState || state !== cookieState) return response('cancelled');
  const verifiedState = await verifyDiscordOAuthState(state);
  if (!verifiedState || verifiedState.sub !== session.sub) return response('cancelled');

  try {
    const prisma = getWebPrisma();
    if (!prisma) throw new Error('Datenbank ist nicht konfiguriert');
    const { token, profile } = await exchangeCode(code);
    await persistDiscordAccount({ prisma, webUserId: session.sub, profile, token, encryptionKey: process.env.OAUTH_TOKEN_ENCRYPTION_KEY });
    return response('connected');
  } catch {
    return response('error');
  }
}
