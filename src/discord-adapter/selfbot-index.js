import { pathToFileURL } from 'node:url';
import { startDiscordSelfbotServer } from './selfbot-server.js';
import { createApplicationLogger } from '../shared/application-logger.js';

async function start() {
  const service = 'simpleyth-discord-selfbot-adapter';
  const instance = await startDiscordSelfbotServer();
  const shutdown = (signal) => {
    createApplicationLogger({ service }).info('adapter_shutdown_requested', { signal });
    instance.server.close(() => instance.shutdown().finally(() => process.exit(0)));
  };
  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  start().catch((error) => {
    createApplicationLogger({ service: 'simpleyth-discord-selfbot-adapter' }).error('adapter_startup_failed', { error: error?.message });
    process.exitCode = 1;
  });
}
