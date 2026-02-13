import express from 'express';

import taskTypeRoutes from './taskType.routes';
import projectRoutes from './project.routes';       
// import taskAssignRoutes from './taskAssign.route' 
import processMasterRoutes from './processMaster.routes';
import taskParamTypeRoutes from './taskParamType.route';
import paramMasterRoutes from './paramMaster.routes';
import dropdownRoutes from './dropdown.route';
import taskRoutes from './task.routes';
import LeavetypeRoutes from './leaveType.route';
import ProjectEmployee from './employeeinvolved.route';
import employees from './employeemaster.route';

const router = express.Router();


router.use('/taskType', taskTypeRoutes)
router.use('/project',projectRoutes)
// router.use('/projectAssign',taskAssignRoutes)
router.use('/processMaster',processMasterRoutes)
router.use('/projectEmployee',ProjectEmployee)
router.use('/parametDataTypes',taskParamTypeRoutes)
router.use('/paramMaster',paramMasterRoutes)
router.use('/dropdowns',dropdownRoutes)
router.use('/tasks',taskRoutes)
router.use('/company',taskRoutes)
router.use('/Leavetype',LeavetypeRoutes)
router.use('/employees',employees)


export default router;