import assert from "node:assert/strict";
import test from "node:test";
import { authenticate } from "../src/web/auth/users.js";
import { createSessionToken, verifySessionToken } from "../src/web/auth/session.js";

const users = [
  { id: "admin-1", email: "admin@example.test", name: "Ada", roles: ["admin", "creator", "viewer"], password: "admin-pass" },
  { id: "creator-1", email: "creator@example.test", name: "Chris", roles: ["creator", "viewer"], password: "creator-pass" },
  { id: "viewer-1", email: "viewer@example.test", name: "Vera", roles: ["viewer"], password: "viewer-pass" },
];

test.beforeEach(() => {
  process.env.WEB_USERS_JSON = JSON.stringify(users);
  process.env.WEB_AUTH_SECRET = "test-only-secret-with-more-than-32-characters";
});

test("authenticates every configured account and returns all its roles", async () => {
  for (const user of users) {
    const result = await authenticate(user.email, user.password);
    assert.deepEqual(result.roles, user.roles);
    assert.equal(result.password, undefined);
  }
});

test("rejects invalid credentials", async () => {
  assert.equal(await authenticate(users[2].email, "wrong"), null);
});

test("signs and verifies a role-bound session", async () => {
  const token = await createSessionToken(users[0]);
  const session = await verifySessionToken(token);
  assert.equal(session.sub, users[0].id);
  assert.deepEqual(session.roles, ["admin", "creator", "viewer"]);
  assert.equal(session.email, users[0].email);
});

test("rejects a session signed with another secret", async () => {
  const token = await createSessionToken(users[0]);
  process.env.WEB_AUTH_SECRET = "a-different-test-secret-with-32-characters";
  assert.equal(await verifySessionToken(token), null);
});
