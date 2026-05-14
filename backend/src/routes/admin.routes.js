import { Router } from 'express';
import { resetEmployees } from '../controllers/admin.controller.js';
import {
  listUsers, createUser, updateUser, deleteUser, resetPassword,
} from '../controllers/admin-users.controller.js';
import { authRequired } from '../middleware/auth.js';

const r = Router();
r.use(authRequired);

// Danger-zone: data wipe
r.post('/reset-employees', resetEmployees);

// Admin user management
r.get('/users',           listUsers);
r.post('/users',          createUser);
r.put('/users/:id',       updateUser);
r.put('/users/:id/password', resetPassword);
r.delete('/users/:id',    deleteUser);

export default r;
