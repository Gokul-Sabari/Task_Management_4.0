import express from 'express';
import fingerPrintRoutes from '../attendance/fingerPrint.route'
import attendanceRoutes from '../attendance/attendance.route'
import { requireAuth } from '../../controllers/configuration/login/requireAuth';

const router = express.Router();


router.use('/',requireAuth, attendanceRoutes)
router.use('/fingerPrint',requireAuth, fingerPrintRoutes)

export default router;