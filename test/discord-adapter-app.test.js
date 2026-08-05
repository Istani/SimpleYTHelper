import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { createDiscordAdapterApp } from '../src/discord-adapter/app.js';

const eventId = '6c8224e5-369e-4c90-8b62-4db8e7ba8b21';
const request = {
  event_id: eventId,
  event_type: 'community.message.delivery-requested.v1',
  schema_version: 1,
  target: { channel_id: '123456789012345678' },
  content: 'Neues Angebot',
};

class MemoryLedger {
  entries = new Map();

  async accept({ eventId: id, payload }) {
    const serialized = JSON.stringify(payload);
    const existing = this.entries.get(id);
    if (existing && existing.serialized !== serialized) return { outcome: 'conflict' };
    if (existing) return { outcome: 'duplicate', deliveryId: existing.deliveryId, acceptedAt: existing.acceptedAt };

    const entry = {
      deliveryId: 'bb1d82b5-369e-4c90-8b62-4db8e7ba8b22',
      acceptedAt: '2026-07-30T18:00:00.000Z',
      serialized,
    };
    this.entries.set(id, entry);
    return { outcome: 'accepted', deliveryId: entry.deliveryId, acceptedAt: entry.acceptedAt };
  }
}

async function post(app, body, { idempotencyKey = eventId, authorization } = {}) {
  const server = app.listen(0);
  await once(server, 'listening');
  const { port } = server.address();
  try {
    return await fetch(`http://127.0.0.1:${port}/internal/v1/deliveries`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': idempotencyKey,
        ...(authorization ? { authorization } : {}),
      },
      body: JSON.stringify(body),
    });
  } finally {
    server.close();
    await once(server, 'close');
  }
}

async function get(app, path) {
  const server = app.listen(0);
  await once(server, 'listening');
  const { port } = server.address();
  try {
    return await fetch(`http://127.0.0.1:${port}${path}`);
  } finally {
    server.close();
    await once(server, 'close');
  }
}

function trustedAdapterApp(ledger = new MemoryLedger()) {
  return createDiscordAdapterApp({ ledger, authenticate: () => true });
}

test('reports adapter readiness without requiring internal authentication', async () => {
  const response = await get(trustedAdapterApp(), '/healthz');

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('accepts a valid Discord delivery and returns its durable acceptance', async () => {
  const response = await post(trustedAdapterApp(), request);

  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), {
    event_id: eventId,
    adapter_delivery_id: 'bb1d82b5-369e-4c90-8b62-4db8e7ba8b22',
    status: 'accepted',
    accepted_at: '2026-07-30T18:00:00.000Z',
  });
});

test('returns the existing acceptance for a duplicate idempotency key and payload', async () => {
  const ledger = new MemoryLedger();
  const app = trustedAdapterApp(ledger);
  await post(app, request);
  const duplicate = await post(app, request);

  assert.equal(duplicate.status, 202);
  assert.equal((await duplicate.json()).status, 'accepted');
  assert.equal(ledger.entries.size, 1);
});

test('rejects reuse of an idempotency key with a different payload', async () => {
  const ledger = new MemoryLedger();
  const app = trustedAdapterApp(ledger);
  await post(app, request);
  const conflict = await post(app, { ...request, content: 'Andere Nachricht' });

  assert.equal(conflict.status, 409);
});

test('rejects a delivery before the ledger when internal service authentication fails', async () => {
  const ledger = new MemoryLedger();
  const app = createDiscordAdapterApp({ ledger, authenticate: () => false });

  const response = await post(app, request, { authorization: 'Bearer invalid' });

  assert.equal(response.status, 401);
  assert.equal(ledger.entries.size, 0);
});

test('lists active bots status when authenticated', async () => {
  const ledger = new MemoryLedger();
  const botManager = {
    listActiveBotsStatus: () => [{
      bot_id: 'announcements',
      settings: { allowReports: true },
      discord_user_id: '111222333',
      ready: true,
    }],
  };
  const app = createDiscordAdapterApp({ ledger, authenticate: () => true, botManager });
  const server = app.listen(0);
  await once(server, 'listening');
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/internal/v1/bots`, {
      headers: { authorization: 'Bearer secret' },
    });
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), {
      bots: [{
        bot_id: 'announcements',
        settings: { allowReports: true },
        discord_user_id: '111222333',
        ready: true,
      }],
    });
  } finally {
    server.close();
    await once(server, 'close');
  }
});
