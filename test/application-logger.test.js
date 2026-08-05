import assert from 'node:assert/strict';
import test from 'node:test';
import { createApplicationLogger } from '../src/shared/application-logger.js';

test('creates a Winston-style JSON console logger with the service name', () => {
  const records = [];
  const logger = createApplicationLogger({ service: 'simpleyth-test', write: (record) => records.push(record) });

  logger.info('healthcheck served', { route: '/healthz' });

  assert.equal(records.length, 1);
  const record = JSON.parse(records[0]);
  assert.equal(record.level, 'info');
  assert.equal(record.service, 'simpleyth-test');
  assert.equal(record.message, 'healthcheck served');
  assert.equal(record.route, '/healthz');
  assert.ok(record.timestamp);
});
