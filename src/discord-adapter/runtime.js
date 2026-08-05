import { createBearerTokenAuthenticator } from './auth.js';
import { createDiscordAdapterApp } from './app.js';
import { PrismaDeliveryLedger } from './prisma-delivery-ledger.js';

export function createDiscordAdapterRuntime({ environment, createPrismaClient, now }) {
  const authenticate = createBearerTokenAuthenticator({ token: environment.INTERNAL_ADAPTER_TOKEN });
  const prisma = createPrismaClient();
  const ledger = new PrismaDeliveryLedger({ prisma, now });

  return {
    app: createDiscordAdapterApp({ ledger, authenticate }),
    prisma,
  };
}
