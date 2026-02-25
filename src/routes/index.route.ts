import express from 'express';
import configurationRoutes from './configuration/index.config.route';
import mastersRoutes from './masters/index.master.route';
import attendanceRoutes from './attendance/index.attendance.route';
import { requireAuth } from '../controllers/configuration/login/requireAuth';

const router = express.Router();

router.use('/configuration', configurationRoutes);
router.use('/masters', requireAuth, mastersRoutes);
router.use('/attendance',requireAuth, attendanceRoutes)

export default router;