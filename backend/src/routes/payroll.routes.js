import { Router } from 'express';
import { listRuns, createRun, processRun, getRun, lockRun, updateLine } from '../controllers/payroll.controller.js';
import { authRequired } from '../middleware/auth.js';

const r = Router();
r.use(authRequired);
r.get('/runs', listRuns);
r.post('/runs', createRun);
r.get('/runs/:id', getRun);
r.post('/runs/:id/process', processRun);
r.post('/runs/:id/lock', lockRun);
r.put('/lines/:lineId', updateLine);
export default r;
