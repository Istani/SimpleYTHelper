import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { pathToFileURL } from 'node:url';
import { createDiscordAdapterRuntime } from './runtime.js';
import { createDiscordAccountRuntime } from './bot-runtime.js';
import { createDiscordJsClientFactory } from './discordjs-client-factory.js';
import { createApplicationLogger } from '../shared/application-logger.js';

export function createPostgresPrismaClient({ databaseUrl }) {
  if (typeof databaseUrl !== 'string' || databaseUrl.length === 0) throw new TypeError('databaseUrl must be a non-empty string');
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
}

/** Starts one isolated account-kind process using the shared adapter runtime. */
export async function startDiscordAdapterServer({
  accountKind = 'bot',
  clientFactory = createDiscordJsClientFactory(),
  service = accountKind === 'selfbot' ? 'simpleyth-discord-selfbot-adapter' : 'simpleyth-discord-adapter',
  environment = process.env,
} = {}) {
  const logger = createApplicationLogger({ service });
  const prisma = createPostgresPrismaClient({ databaseUrl: environment.DATABASE_URL });
  const accountRuntime = createDiscordAccountRuntime({ prisma, clientFactory, logger, accountKind });
  const startedAccounts = await accountRuntime.start();
  const runtime = createDiscordAdapterRuntime({ environment, createPrismaClient: () => prisma, botManager: accountRuntime.manager });
  const port = Number.parseInt(environment.PORT ?? '3000', 10);
  const server = runtime.app.listen(port, '0.0.0.0', () => logger.info('adapter_listening', { port, accountKind, startedAccountCount: startedAccounts.length }));
  const pollIntervalMs = Number.parseInt(environment.DISCORD_BOT_POLL_INTERVAL_MS ?? String(60 * 1000), 10);
  const pollTimer = setInterval(async () => {
    try {
      const syncResult = await accountRuntime.manager.pollAndSyncBots();
      if (syncResult.started.length || syncResult.stopped.length || syncResult.updated.length) logger.info('account_poll_synchronized', { accountKind, ...syncResult });
    } catch (error) {
      logger.error('account_poll_sync_failed', { accountKind, error: error?.message });
    }
  }, pollIntervalMs);
  if (typeof pollTimer.unref === 'function') pollTimer.unref();

  const shutdown = async () => {
    clearInterval(pollTimer);
    await accountRuntime.shutdown();
    await runtime.prisma.$disconnect();
  };
  return { server, shutdown, accountRuntime, runtime };
}

async function start() {
  const service = 'simpleyth-discord-adapter';
  const instance = await startDiscordAdapterServer({ service });
  const shutdown = (signal) => {
    createApplicationLogger({ service }).info('adapter_shutdown_requested', { signal });
    instance.server.close(() => instance.shutdown().finally(() => process.exit(0)));
  };
  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  start().catch((error) => {
    createApplicationLogger({ service: 'simpleyth-discord-adapter' }).error('adapter_startup_failed', { error: error?.message });
    process.exitCode = 1;
  });
}
