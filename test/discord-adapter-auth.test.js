import assert from 'node:assert/strict';
import test from 'node:test';
import { createBearerTokenAuthenticator } from '../src/discord-adapter/auth.js';

test('accepts only the configured internal bearer token', () => {
  const authenticate = createBearerTokenAuthenticator({ token: 'adapter-test-token' });

  assert.equal(authenticate({ authorization: 'Bearer adapter-test-token' }), true);
  assert.equal(authenticate({ authorization: undefined }), false);
  assert.equal(authenticate({ authorization: 'Basic adapter-test-token' }), false);
  assert.equal(authenticate({ authorization: 'Bearer incorrect-token' }), false);
});

test('rejects an empty internal bearer token at startup', () => {
  assert.throws(
    () => createBearerTokenAuthenticator({ token: '' }),
    { message: 'token must be a non-empty string' },
  );
});
