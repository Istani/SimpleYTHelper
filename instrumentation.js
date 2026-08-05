export async function register() {
  const { webLogger } = await import('./src/web/logger.js');
  webLogger.info('web_runtime_started');
}
