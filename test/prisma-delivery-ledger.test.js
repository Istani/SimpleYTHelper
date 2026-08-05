import assert from 'node:assert/strict';
import test from 'node:test';
import { PrismaDeliveryLedger } from '../src/discord-adapter/prisma-delivery-ledger.js';

const eventId = '6c8224e5-369e-4c90-8b62-4db8e7ba8b21';
const payload = {
  event_id: eventId,
  event_type: 'community.message.delivery-requested.v1',
  schema_version: 1,
  target: { channel_id: '123456789012345678' },
  content: 'Neues Angebot',
};

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

test('persists a first adapter acceptance as an immutable ledger entry', async () => {
  const prisma = new FakePrisma();
  const ledger = new PrismaDeliveryLedger({ prisma, now: () => new Date('2026-07-30T18:00:00.000Z') });

  const result = await ledger.accept({ eventId, payload });

  assert.deepEqual(result, {
    outcome: 'accepted',
    deliveryId: 'bb1d82b5-369e-4c90-8b62-4db8e7ba8b22',
    acceptedAt: '2026-07-30T18:00:00.000Z',
  });
  assert.equal(prisma.records.get(eventId).status, 'accepted');
});

test('returns the persisted acceptance when the same event is retried', async () => {
  const prisma = new FakePrisma();
  const ledger = new PrismaDeliveryLedger({ prisma, now: () => new Date('2026-07-30T18:00:00.000Z') });
  await ledger.accept({ eventId, payload });

  const result = await ledger.accept({ eventId, payload });

  assert.equal(result.outcome, 'duplicate');
  assert.equal(prisma.records.size, 1);
});

test('rejects a retry that reuses an event ID with different payload data', async () => {
  const prisma = new FakePrisma();
  const ledger = new PrismaDeliveryLedger({ prisma, now: () => new Date('2026-07-30T18:00:00.000Z') });
  await ledger.accept({ eventId, payload });

  const result = await ledger.accept({ eventId, payload: { ...payload, content: 'Andere Nachricht' } });

  assert.deepEqual(result, { outcome: 'conflict' });
});
