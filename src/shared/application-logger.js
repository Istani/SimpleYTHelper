import { Writable } from 'node:stream';
import winston from 'winston';

export function createApplicationLogger({ service, write } = {}) {
  if (!service || typeof service !== 'string') {
    throw new TypeError('service is required');
  }

  const transport = typeof write === 'function'
    ? new winston.transports.Stream({
      stream: new Writable({
        write(chunk, _encoding, callback) {
          write(String(chunk));
          callback();
        },
      }),
    })
    : new winston.transports.Console();

  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: { service },
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ),
    transports: [transport],
  });
}
