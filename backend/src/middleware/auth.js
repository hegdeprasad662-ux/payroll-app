import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token' });
  }
  try {
    const decoded = jwt.verify(header.slice(7), config.jwtSecret);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
