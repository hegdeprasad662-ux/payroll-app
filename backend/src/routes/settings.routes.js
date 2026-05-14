import { Router } from 'express';
import { list, update } from '../controllers/settings.controller.js';
import { authRequired } from '../middleware/auth.js';

const r = Router();
r.use(authRequired);
r.get('/', list);
r.post('/', update);
export default r;
