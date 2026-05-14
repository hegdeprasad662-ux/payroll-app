import { Router } from 'express';
import { login, me } from '../controllers/auth.controller.js';
import { authRequired } from '../middleware/auth.js';

const r = Router();
r.post('/login', login);
r.get('/me', authRequired, me);
export default r;
