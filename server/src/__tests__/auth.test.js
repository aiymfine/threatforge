import { describe, it, expect, vi } from 'vitest';

function cryptoEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function createAuthMiddleware(adminKey) {
  return function authMiddleware(req, res, next) {
    if (!adminKey) return next();
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization required' });
    }
    const token = authHeader.slice(7);
    if (token.length !== adminKey.length || !cryptoEqual(token, adminKey)) {
      return res.status(403).json({ error: 'Invalid API key' });
    }
    next();
  };
}

function mockRes() {
  const res = {
    _status: null,
    _body: null,
    status(code) { res._status = code; return res; },
    json(data) { res._body = data; return res; }
  };
  return res;
}

describe('auth middleware', () => {
  it('passes through when no admin key is configured', () => {
    const middleware = createAuthMiddleware(null);
    const req = { headers: {} };
    const res = mockRes();
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res._status).toBeNull();
  });

  it('passes with correct bearer token', () => {
    const middleware = createAuthMiddleware('my-secret-key');
    const req = { headers: { authorization: 'Bearer my-secret-key' } };
    const res = mockRes();
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('rejects missing authorization header', () => {
    const middleware = createAuthMiddleware('my-secret-key');
    const res = mockRes();
    const next = vi.fn();
    middleware({ headers: {} }, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
  });

  it('rejects wrong bearer token', () => {
    const middleware = createAuthMiddleware('correct-key');
    const res = mockRes();
    const next = vi.fn();
    middleware({ headers: { authorization: 'Bearer wrong-key' } }, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(403);
  });

  it('rejects same-length wrong key (timing-safe)', () => {
    const middleware = createAuthMiddleware('abcdefgh');
    const res = mockRes();
    const next = vi.fn();
    middleware({ headers: { authorization: 'Bearer abcdefgz' } }, res, next);
    expect(res._status).toBe(403);
  });

  it('rejects malformed authorization header', () => {
    const middleware = createAuthMiddleware('my-secret-key');
    const res = mockRes();
    const next = vi.fn();
    middleware({ headers: { authorization: 'Basic my-secret-key' } }, res, next);
    expect(res._status).toBe(401);
  });

  it('rejects empty bearer token', () => {
    const middleware = createAuthMiddleware('my-secret-key');
    const res = mockRes();
    const next = vi.fn();
    middleware({ headers: { authorization: 'Bearer ' } }, res, next);
    expect(res._status).toBe(403);
  });
});

describe('cryptoEqual', () => {
  it('returns true for equal strings', () => {
    expect(cryptoEqual('hello', 'hello')).toBe(true);
    expect(cryptoEqual('a'.repeat(100), 'a'.repeat(100))).toBe(true);
  });

  it('returns false for different strings of same length', () => {
    expect(cryptoEqual('hello', 'hellz')).toBe(false);
  });

  it('returns false for different lengths', () => {
    expect(cryptoEqual('', 'a')).toBe(false);
  });

  it('returns true for empty strings', () => {
    expect(cryptoEqual('', '')).toBe(true);
  });
});
