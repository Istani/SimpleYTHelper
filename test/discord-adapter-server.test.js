import assert from 'node:assert/strict';
import test from 'node:test';
import { createPostgresPrismaClient } from '../src/discord-adapter/server.js';

test('creates the PostgreSQL-backed Prisma client from a runtime database URL', () => {
  const prisma = createPostgresPrismaClient({ databaseUrl: 'postgresql://user:password@127.0.0.1:5432/postgres' });

  assert.equal(typeof prisma.$disconnect, 'function');
});

test('rejects a missing runtime database URL before Prisma construction', () => {
  assert.throws(
    () => createPostgresPrismaClient({ databaseUrl: undefined }),
    { message: 'databaseUrl must be a non-empty string' },
  );
});
