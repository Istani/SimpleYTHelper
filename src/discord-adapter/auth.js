import { timingSafeEqual } from 'node:crypto';

function bearerToken(authorization) {
  if (typeof authorization !== 'string') return null;
  const match = /^Bearer ([^\s]+)$/.exec(authorization);
  return match?.[1] ?? null;
}

export function createBearerTokenAuthenticator({ token }) {
  if (typeof token !== 'string' || token.length === 0) {
    throw new TypeError('token must be a non-empty string');
  }

  const expected = Buffer.from(token);
  return ({ authorization }) => {
    const candidateToken = bearerToken(authorization);
    if (!candidateToken) return false;

    const candidate = Buffer.from(candidateToken);
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  };
}
