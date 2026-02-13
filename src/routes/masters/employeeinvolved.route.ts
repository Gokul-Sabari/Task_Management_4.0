// routes/masters/taskManagement/employeeinvolved.routes.ts
import express from 'express';
import {
    getAllProjectEmployee,
    getProjectEmployeeById,
    getProjectEmployeesByProjectId,
    createProjectEmployee,
    bulkCreateProjectEmployees,
    updateProjectEmployee,
    bulkUpdateProjectEmployees,
    deleteProjectEmployee,
    bulkDeleteProjectEmployees,
    getAllActiveProjectEmployees,
    getProjectDropdown,
    getEmployeeDropdown
} from '../../controllers/masters/taskManagement/employeeinvolved.contoller';
import { authenticate, authorize } from '../../middleware/auth';

const router = express.Router();

// Public GET routes
router.get('/', getAllProjectEmployee);
router.get('/active', getAllActiveProjectEmployees);
router.get('/byProject/:projectId', getProjectEmployeesByProjectId);
router.get('/:id', getProjectEmployeeById);

// Dropdown routes
router.get('/projects/dropdown', getProjectDropdown);
router.get('/employees/dropdown', getEmployeeDropdown);

// Protected POST routes (Admin/Manager only)
router.post('/',
    authenticate,
    authorize([1, 2]),
    createProjectEmployee
);

router.post('/bulk',
    authenticate,
    authorize([1, 2]),
    bulkCreateProjectEmployees
);

// Protected PUT routes (Admin/Manager only)
router.put('/:id',
    authenticate,
    authorize([1, 2]), 
    updateProjectEmployee
);

router.put('/bulk/update',
    authenticate,
    authorize([1, 2]),
    bulkUpdateProjectEmployees
);

// Protected DELETE routes (Admin only)
router.delete('/:id',
    authenticate,
    authorize([1]), 
    deleteProjectEmployee
);

router.delete('/bulk/delete',
    authenticate,
    authorize([1]),
    bulkDeleteProjectEmployees
);

export default router;