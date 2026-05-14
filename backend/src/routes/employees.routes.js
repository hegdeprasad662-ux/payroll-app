import { Router } from 'express';
import { list, getOne, create, update, remove } from '../controllers/employees.controller.js';
import { authRequired } from '../middleware/auth.js';

const r = Router();
r.use(authRequired);
r.get('/', list);
r.get('/:id', getOne);
r.post('/', create);
r.put('/:id', update);
r.delete('/:id', remove);
export default r;
