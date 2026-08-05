import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { createDiscordAdapterRuntime } from '../src/discord-adapter/runtime.js';

class FakePrisma {
  records = new Map();
  adapterDelivery = {
    create: async ({ data }) => {
      if (this.records.has(data.eventId)) {
        const error = new Error('Unique constraint failed');
        error.code = 'P2002';
        throw error;
      }
      const record = { id: 'bb1d82b5-369e-4c90-8b62-4db8e7ba8b22', ...data };
      this.records.set(data.eventId, record);
      return record;
    },
    findUnique: async ({ where }) => this.records.get(where.eventId) ?? null,
  };
}

test('wires the runtime bearer token and Prisma ledger into the adapter app', async () => {
  const prisma = new FakePrisma();
  const { app } = createDiscordAdapterRuntime({
    environment: { INTERNAL_ADAPTER_TOKEN: 'runtime-token' },
    createPrismaClient: () => prisma,
    now: () => new Date('2026-08-05T12:00:00.000Z'),
  });

  const server = app.listen(0);
  await once(server, 'listening');
  const { port } = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/internal/v1/deliveries`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer runtime-token',
        'content-type': 'application/json',
        'idempotency-key': '6c8224e5-369e-4c90-8b62-4db8e7ba8b21',
      },
      body: JSON.stringify({
        event_id: '6c8224e5-369e-4c90-8b62-4db8e7ba8b21',
        event_type: 'community.message.delivery-requested.v1',
        schema_version: 1,
        target: { channel_id: '123456789012345678' },
        content: 'Neues Angebot',
      }),
    });

    assert.equal(response.status, 202);
    assert.equal(prisma.records.size, 1);
  } finally {
    server.close();
    await once(server, 'close');
  }
});

test('fails before constructing a database client without an internal token', () => {
  let constructed = false;
  assert.throws(
    () => createDiscordAdapterRuntime({
      environment: {},
      createPrismaClient: () => {
        constructed = true;
        return new FakePrisma();
      },
    }),
    { message: 'token must be a non-empty string' },
  );
  assert.equal(constructed, false);
});
