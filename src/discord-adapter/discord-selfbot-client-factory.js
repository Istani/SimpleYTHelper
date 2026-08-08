import { Client } from 'discord.js-selfbot-v13';

/**
 * The selfbot library has its own gateway implementation. This factory deliberately
 * exposes no send helper and only creates an inbound-capable client for the shared runtime.
 */
export function createDiscordSelfbotClientFactory({ Client: SelfbotClient = Client } = {}) {
  return () => new SelfbotClient({ checkUpdate: false });
}
