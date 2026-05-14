import { Router } from 'express';
import multer from 'multer';
import { uploadInputs } from '../controllers/upload.controller.js';
import { authRequired } from '../middleware/auth.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
const r = Router();
r.use(authRequired);
r.post('/inputs', upload.single('file'), uploadInputs);
export default r;
