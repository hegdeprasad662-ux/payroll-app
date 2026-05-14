import { Router } from 'express';
import multer from 'multer';
import {
  uploadEmployees, uploadConsultants, uploadLop,
  templateEmployees, templateConsultants, templateLop,
} from '../controllers/bulk-uploads.controller.js';
import { authRequired } from '../middleware/auth.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
const r = Router();
r.use(authRequired);

r.post('/employees',   upload.single('file'), uploadEmployees);
r.post('/consultants', upload.single('file'), uploadConsultants);
r.post('/lop',         upload.single('file'), uploadLop);

// Template downloads (auth still required)
r.get('/template/employees',   templateEmployees);
r.get('/template/consultants', templateConsultants);
r.get('/template/lop',         templateLop);

export default r;
