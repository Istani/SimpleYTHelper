import { NextResponse } from 'next/server';
import { getSession, createDiscordOAuthState, discordOAuthStateCookie } from '../../../../../src/web/auth/session.js';
import { buildDiscordAuthorizationUrl } from '../../../../../src/web/connected-accounts.js';

export async function GET() {
  const session = await getSession();
  if (!session?.sub) return NextResponse.redirect(new URL('/login', process.env.DISCORD_OAUTH_REDIRECT_URI || 'http://localhost'));

  try {
    const state = await createDiscordOAuthState(session.sub);
    const location = buildDiscordAuthorizationUrl({
      clientId: process.env.DISCORD_OAUTH_CLIENT_ID,
      redirectUri: process.env.DISCORD_OAUTH_REDIRECT_URI,
      state,
    });
    const response = NextResponse.redirect(location);
    response.cookies.set(discordOAuthStateCookie.name, state, discordOAuthStateCookie.options);
    return response;
  } catch {
    return NextResponse.redirect(new URL('/connections?discord=configuration-error', process.env.DISCORD_OAUTH_REDIRECT_URI || 'http://localhost'));
  }
}
