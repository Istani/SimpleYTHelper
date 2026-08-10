import assert from 'node:assert/strict';
import test from 'node:test';
import {
  saveDiscordOAuthApplication,
  loadDiscordOAuthApplication,
  publicDiscordOAuthApplication,
} from '../src/web/admin/discord-oauth-application.js';

const encryptionKey = Buffer.alloc(32, 11).toString('base64');

function fakePrisma() {
  const calls = [];
  return {
    calls,
    oauthProviderConfiguration: {
      findUnique: async (argument) => {
        calls.push({ method: 'findUnique', argument });
        return { provider: 'discord', clientId: '123456789012345678', clientSecretCiphertext: null, redirectUri: 'https://simpleyth.example.test/api/connections/discord/callback', isActive: true, rotatedAt: null, createdAt: new Date(), updatedAt: new Date() };
      },
      upsert: async (argument) => { calls.push({ method: 'upsert', argument }); return { provider: 'discord', createdAt: new Date(), updatedAt: new Date(), ...argument.create }; },
    },
  };
}

test('stores the Discord OAuth client secret encrypted and exposes only safe configuration facts', async () => {
  const prisma = fakePrisma();
  const saved = await saveDiscordOAuthApplication({ prisma, clientId: '123456789012345678', clientSecret: 'discord-client-secret', redirectUri: 'https://simpleyth.example.test/api/connections/discord/callback', isActive: true, encryptionKey });
  const call = prisma.calls.find((entry) => entry.method === 'upsert').argument;
  assert.equal(call.create.clientSecretCiphertext.includes('discord-client-secret'), false);
  assert.equal(JSON.stringify(saved).includes('discord-client-secret'), false);
  assert.equal(saved.configured, true);
  assert.equal('clientSecretCiphertext' in saved, false);
});

test('decrypts an active Discord OAuth configuration only for server-side provider calls', async () => {
  const prisma = fakePrisma();
  await saveDiscordOAuthApplication({ prisma, clientId: '123456789012345678', clientSecret: 'discord-client-secret', redirectUri: 'https://simpleyth.example.test/api/connections/discord/callback', isActive: true, encryptionKey });
  const stored = prisma.calls.find((entry) => entry.method === 'upsert').argument.create;
  prisma.oauthProviderConfiguration.findUnique = async () => stored;
  const runtime = await loadDiscordOAuthApplication(prisma, encryptionKey);
  assert.deepEqual(runtime, { clientId: '123456789012345678', clientSecret: 'discord-client-secret', redirectUri: 'https://simpleyth.example.test/api/connections/discord/callback' });
});

test('rejects incomplete or insecure remote callback configuration', async () => {
  const prisma = fakePrisma();
  await assert.rejects(() => saveDiscordOAuthApplication({ prisma, clientId: '', clientSecret: 'secret-123', redirectUri: 'https://simpleyth.example.test/callback', isActive: true, encryptionKey }), /Client-ID/);
  await assert.rejects(() => saveDiscordOAuthApplication({ prisma, clientId: '123456789012345678', clientSecret: 'secret-123', redirectUri: 'http://simpleyth.example.test/callback', isActive: true, encryptionKey }), /HTTPS/);
});
