import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildDiscordAuthorizationUrl,
  encryptToken,
  decryptToken,
  persistDiscordAccount,
  publicConnectedAccount,
} from '../src/web/connected-accounts.js';

const encryptionKey = Buffer.alloc(32, 7).toString('base64');

test('creates a Discord authorization URL with exactly the required OAuth scopes and bound state', () => {
  const url = new URL(buildDiscordAuthorizationUrl({
    clientId: 'discord-client-id',
    redirectUri: 'https://app.example.test/api/connections/discord/callback',
    state: 'signed-state',
  }));

  assert.equal(url.origin, 'https://discord.com');
  assert.equal(url.pathname, '/oauth2/authorize');
  assert.equal(url.searchParams.get('client_id'), 'discord-client-id');
  assert.equal(url.searchParams.get('response_type'), 'code');
  assert.equal(url.searchParams.get('redirect_uri'), 'https://app.example.test/api/connections/discord/callback');
  assert.equal(url.searchParams.get('scope'), 'identify guilds');
  assert.equal(url.searchParams.get('state'), 'signed-state');
});

test('encrypts OAuth tokens at rest and rejects ciphertext authentication failures', () => {
  const ciphertext = encryptToken('discord-access-token', encryptionKey);
  assert.notEqual(ciphertext.includes('discord-access-token'), true);
  assert.equal(decryptToken(ciphertext, encryptionKey), 'discord-access-token');
  const tampered = `${ciphertext.slice(0, -1)}${ciphertext.endsWith('A') ? 'B' : 'A'}`;
  assert.throws(() => decryptToken(tampered, encryptionKey), /ungültig|invalid/i);
});

test('upserts Discord account metadata and encrypted tokens without returning either token', async () => {
  const calls = [];
  const prisma = {
    connectedAccount: {
      upsert: async (argument) => {
        calls.push(argument);
        return {
          id: 'account-1', provider: 'discord', providerAccountId: '1234', displayName: 'Sascha', avatarUrl: null,
          scopes: ['identify', 'guilds'], tokenExpiresAt: new Date('2026-08-10T12:00:00Z'), createdAt: new Date(), updatedAt: new Date(),
          ...argument.create,
        };
      },
    },
  };

  const result = await persistDiscordAccount({
    prisma,
    webUserId: 'web-user-1',
    profile: { id: '1234', global_name: 'Sascha', username: 'sascha', avatar: null },
    token: { access_token: 'access-secret', refresh_token: 'refresh-secret', expires_in: 3600, scope: 'identify guilds' },
    encryptionKey,
  });

  assert.deepEqual(calls[0].where, { webUserId_provider_providerAccountId: { webUserId: 'web-user-1', provider: 'discord', providerAccountId: '1234' } });
  assert.equal(calls[0].create.accessTokenCiphertext.includes('access-secret'), false);
  assert.equal(calls[0].create.refreshTokenCiphertext.includes('refresh-secret'), false);
  assert.equal(JSON.stringify(result).includes('secret'), false);
  assert.deepEqual(result, publicConnectedAccount(result));
});
