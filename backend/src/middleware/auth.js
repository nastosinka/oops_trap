// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const prisma = require('../db/prismaClient');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

/**
 * Middleware: requireAuth
 * Проверяет Authorization: Bearer <token>
 * При успехе добавляет req.user = { id, username, role, iat, exp }
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match ? match[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Token required', code: 401 });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { sub, username, role, iat, exp }
    next();
  } catch (err) {
    console.error('JWT verify error:', err);
    return res.status(401).json({ error: 'Invalid token', code: 401 });
  }
}

/**
 * Middleware factory: requireRole('admin') etc.
 */
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required', code: 401 });
    if (req.user.role !== role) return res.status(403).json({ error: 'Forbidden', code: 403 });
    next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
};
