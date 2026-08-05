import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const file = new URL('../contracts/openapi/internal-discord-delivery-v1.openapi.json', import.meta.url);
const contract = JSON.parse(await readFile(file, 'utf8'));
const operation = contract.paths?.['/internal/v1/deliveries']?.post;

assert.equal(contract.openapi, '3.1.0');
assert.equal(contract.info.version, '1.0.0');
assert.ok(operation, 'POST /internal/v1/deliveries is required');
assert.equal(operation.responses?.['202']?.description !== undefined, true);
assert.equal(operation.responses?.['409']?.description !== undefined, true);
assert.equal(operation.security?.[0]?.internalServiceAuth?.length, 0);

console.log('OpenAPI contract structure is valid');
