import { parseAndImport } from '../services/excel-parser.js';
import { logAudit } from '../middleware/auditLog.js';

export async function uploadInputs(req, res) {
  if (!req.file) return res.status(400).json({ error: 'file required' });
  const period = req.body.period;
  if (!period) return res.status(400).json({ error: 'period required (e.g. 2025-04)' });
  const result = await parseAndImport(req.file.buffer, period);
  await logAudit(req.user?.email, 'UPLOAD_FILE', 'Period', period, { name: req.file.originalname, ...result });
  res.json(result);
}
