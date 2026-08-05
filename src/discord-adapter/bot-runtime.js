import { createMultiBotManager } from './multi-bot-manager.js';
import { createPrismaBotRegistrationRepository } from './prisma-bot-registration-repository.js';

export function createDiscordBotRuntime({ prisma, clientFactory }) {
  const registrationRepository = createPrismaBotRegistrationRepository({ prisma });
  const manager = createMultiBotManager({ clientFactory, registrationRepository });

  return {
    start: () => manager.loadActiveBotsFromDatabase(),
    shutdown: () => manager.shutdownAll(),
    manager,
  };
}
