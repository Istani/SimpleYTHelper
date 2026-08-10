import { NextResponse } from 'next/server';
import { getSession, createDiscordOAuthState, discordOAuthStateCookie } from '../../../../../src/web/auth/session.js';
import { getWebPrisma } from '../../../../../src/web/auth/users.js';
import { buildDiscordAuthorizationUrl } from '../../../../../src/web/connected-accounts.js';
import { loadDiscordOAuthApplication } from '../../../../../src/web/admin/discord-oauth-application.js';

export async function GET(request) {
  const session = await getSession();
  if (!session?.sub) return NextResponse.redirect(new URL('/login', request.url));

  try {
    const prisma = getWebPrisma();
    const configuration = prisma && await loadDiscordOAuthApplication(prisma, process.env.OAUTH_TOKEN_ENCRYPTION_KEY);
    if (!configuration) throw new Error('Discord OAuth ist nicht konfiguriert');
    const state = await createDiscordOAuthState(session.sub);
    const location = buildDiscordAuthorizationUrl({ clientId: configuration.clientId, redirectUri: configuration.redirectUri, state });
    const response = NextResponse.redirect(location);
    response.cookies.set(discordOAuthStateCookie.name, state, discordOAuthStateCookie.options);
    return response;
  } catch {
    return NextResponse.redirect(new URL('/connections?discord=configuration-error', request.url));
  }
}
