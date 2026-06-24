const ADMIN_KEY = process.env.TF_ADMIN_KEY;

function authMiddleware(req, res, next) {
  // If no admin key is configured, skip auth (local dev mode)
  if (!ADMIN_KEY) return next();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  const token = authHeader.slice(7);
  // Constant-time comparison to prevent timing attacks
  if (token.length !== ADMIN_KEY.length || !cryptoEqual(token, ADMIN_KEY)) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  next();
}

// Simple constant-time string comparison
function cryptoEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

module.exports = authMiddleware;
