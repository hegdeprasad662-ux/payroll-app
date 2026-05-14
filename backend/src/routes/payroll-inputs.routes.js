import { Router } from 'express';
import {
  getPeriodInputs, upsertLop, upsertIncentive, upsertArrear,
  upsertReferral, upsertOther, removeInput,
} from '../controllers/payroll-inputs.controller.js';
import { authRequired } from '../middleware/auth.js';

const r = Router();
r.use(authRequired);
r.get('/:period', getPeriodInputs);
r.put('/:period/lop/:employeeId', upsertLop);
r.put('/:period/incentive/:employeeId', upsertIncentive);
r.put('/:period/arrear/:employeeId', upsertArrear);
r.put('/:period/referral/:employeeId', upsertReferral);
r.put('/:period/other/:employeeId', upsertOther);
r.delete('/:period/:type/:employeeId', removeInput);
export default r;
