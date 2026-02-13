import express from 'express';

import attendanceRoutes from './attendance.route';


const router = express.Router();


router.use('/attendance', attendanceRoutes)


export default router;