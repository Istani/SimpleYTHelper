import http from 'node:http';
import { createPostgresPrismaClient } from './server.js';
import { createDiscordAccountRuntime } from './bot-runtime.js';
import { createDiscordSelfbotClientFactory } from './discord-selfbot-client-factory.js';
import { createApplicationLogger } from '../shared/application-logger.js';

/**
 * Isolated inbound-only selfbot process. It intentionally has no Discord delivery
 * HTTP route and does not construct the official bot adapter application.
 */
export async function startDiscordSelfbotServer({ environment = process.env, prisma: injectedPrisma, accountRuntime: injectedRuntime, logger: injectedLogger } = {}) {
  const service = 'simpleyth-discord-selfbot-adapter';
  const logger = injectedLogger || createApplicationLogger({ service });
  const prisma = injectedPrisma || createPostgresPrismaClient({ databaseUrl: environment.DATABASE_URL });
  const accountRuntime = injectedRuntime || createDiscordAccountRuntime({
    prisma,
    clientFactory: createDiscordSelfbotClientFactory(),
    logger,
    accountKind: 'selfbot',
  });
  const startedAccounts = await accountRuntime.start();
  const port = Number.parseInt(environment.PORT ?? '3000', 10);
  const internalToken = environment.INTERNAL_ADAPTER_TOKEN;
  const server = http.createServer((request, response) => {
    if (request.method === 'GET' && request.url === '/internal/v1/bots') {
      if (!internalToken || request.headers.authorization !== `Bearer ${internalToken}`) {
        response.writeHead(401); response.end(); return;
      }
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ bots: accountRuntime.manager.listActiveBotsStatus() }));
      return;
    }
    if (request.method === 'GET' && request.url === '/internal/v1/bots/guilds') {
      if (!internalToken || request.headers.authorization !== `Bearer ${internalToken}`) {
        response.writeHead(401); response.end(); return;
      }
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ bots: accountRuntime.manager.listActiveBotsGuildInventory() }));
      return;
    }
    if (request.method === 'GET' && request.url === '/healthz') {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ status: 'ok', accountKind: 'selfbot' }));
      return;
    }
    response.writeHead(404);
    response.end();
  });
  await new Promise((resolve) => server.listen(port, '0.0.0.0', resolve));
  logger.info('selfbot_adapter_listening', { port, startedAccountCount: startedAccounts.length });
  const pollIntervalMs = Number.parseInt(environment.DISCORD_BOT_POLL_INTERVAL_MS ?? String(60 * 1000), 10);
  const pollTimer = setInterval(() => accountRuntime.manager.pollAndSyncBots().catch((error) => logger.error('selfbot_poll_sync_failed', { error: error?.message })), pollIntervalMs);
  if (typeof pollTimer.unref === 'function') pollTimer.unref();
  return {
    server,
    async shutdown() {
      clearInterval(pollTimer);
      await accountRuntime.shutdown();
      await new Promise((resolve) => server.close(resolve));
      await prisma.$disconnect();
    },
  };
}
