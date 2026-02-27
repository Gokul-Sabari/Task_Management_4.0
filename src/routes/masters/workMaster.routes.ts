import express from 'express';
import {
    getAllWorks,
    getWorkByWorkId,
    createWorkMaster,
    updateWorkMaster,
    deleteWorkMaster,
    hardDeleteWorkMaster,
    getActiveWorks,
    restoreWorkMaster,
    getWorkStatistics,
    getWorksByEmployeeId,
    getWorksByTaskId,
    bulkCreateWorkMaster
} from '../../controllers/masters/taskManagement/workMaster.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: WorkMaster
 *   description: Work Master management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     WorkParameter:
 *       type: object
 *       properties:
 *         Param_Id:
 *           type: integer
 *           example: 5
 *         Default_Value:
 *           type: string
 *           nullable: true
 *           example: "10"
 *         Current_Value:
 *           type: string
 *           nullable: true
 *           example: "15"
 * 
 *     WorkMaster:
 *       type: object
 *       required:
 *         - Work_Id
 *         - Sch_Id
 *         - Task_Id
 *         - Emp_Id
 *         - Work_Dt
 *       properties:
 *         SNo:
 *           type: integer
 *           readOnly: true
 *           example: 1
 *         Work_Id:
 *           type: integer
 *           minimum: 1
 *           example: 1001
 *         Sch_Id:
 *           type: integer
 *           minimum: 1
 *           example: 5
 *         Task_Id:
 *           type: integer
 *           minimum: 1
 *           example: 10
 *         Emp_Id:
 *           type: integer
 *           minimum: 1
 *           example: 101
 *         Work_Dt:
 *           type: string
 *           format: date
 *           example: "2024-01-15"
 *         Work_Done:
 *           type: string
 *           nullable: true
 *           example: "Completed initial setup"
 *         Start_Time:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2024-01-15T09:00:00.000Z"
 *         End_Time:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2024-01-15T12:30:00.000Z"
 *         Tot_Minutes:
 *           type: integer
 *           nullable: true
 *           example: 210
 *         Work_Status:
 *           type: string
 *           enum: [Pending, In Progress, Completed, Deleted]
 *           default: "Pending"
 *           example: "Completed"
 *         Entry_By:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         Entry_Date:
 *           type: string
 *           format: date-time
 *           readOnly: true
 *           example: "2024-01-15T08:00:00.000Z"
 *         Update_By:
 *           type: integer
 *           nullable: true
 *           example: 2
 *         Update_Date:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2024-01-15T13:00:00.000Z"
 *         Process_Id:
 *           type: integer
 *           nullable: true
 *           example: 501
 *         parameters:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WorkParameter'
 * 
 *     WorkMasterCreate:
 *       type: object
 *       required:
 *         - Work_Id
 *         - Sch_Id
 *         - Task_Id
 *         - Emp_Id
 *         - Work_Dt
 *       properties:
 *         Work_Id:
 *           type: integer
 *           minimum: 1
 *           example: 1001
 *         Sch_Id:
 *           type: integer
 *           minimum: 1
 *           example: 5
 *         Task_Id:
 *           type: integer
 *           minimum: 1
 *           example: 10
 *         Emp_Id:
 *           type: integer
 *           minimum: 1
 *           example: 101
 *         Work_Dt:
 *           type: string
 *           format: date
 *           example: "2024-01-15"
 *         Work_Done:
 *           type: string
 *           nullable: true
 *           optional: true
 *           example: "Completed initial setup"
 *         Start_Time:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           optional: true
 *           example: "2024-01-15T09:00:00.000Z"
 *         End_Time:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           optional: true
 *           example: "2024-01-15T12:30:00.000Z"
 *         Tot_Minutes:
 *           type: integer
 *           nullable: true
 *           optional: true
 *           example: 210
 *         Work_Status:
 *           type: string
 *           enum: [Pending, In Progress, Completed]
 *           default: "Pending"
 *           optional: true
 *         Entry_By:
 *           type: integer
 *           nullable: true
 *           optional: true
 *           example: 1
 *         Process_Id:
 *           type: integer
 *           nullable: true
 *           optional: true
 *           example: 501
 *         Parameters:
 *           type: array
 *           optional: true
 *           items:
 *             type: object
 *             properties:
 *               Param_Id:
 *                 type: integer
 *                 example: 5
 *               Default_Value:
 *                 type: string
 *                 nullable: true
 *                 example: "10"
 *               Current_Value:
 *                 type: string
 *                 nullable: true
 *                 example: "15"
 * 
 *     WorkMasterUpdate:
 *       type: object
 *       properties:
 *         Work_Id:
 *           type: integer
 *           minimum: 1
 *           optional: true
 *           example: 1001
 *         Sch_Id:
 *           type: integer
 *           minimum: 1
 *           optional: true
 *           example: 5
 *         Task_Id:
 *           type: integer
 *           minimum: 1
 *           optional: true
 *           example: 10
 *         Emp_Id:
 *           type: integer
 *           minimum: 1
 *           optional: true
 *           example: 101
 *         Work_Dt:
 *           type: string
 *           format: date
 *           optional: true
 *           example: "2024-01-15"
 *         Work_Done:
 *           type: string
 *           nullable: true
 *           optional: true
 *           example: "Completed initial setup"
 *         Start_Time:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           optional: true
 *           example: "2024-01-15T09:00:00.000Z"
 *         End_Time:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           optional: true
 *           example: "2024-01-15T12:30:00.000Z"
 *         Tot_Minutes:
 *           type: integer
 *           nullable: true
 *           optional: true
 *           example: 210
 *         Work_Status:
 *           type: string
 *           enum: [Pending, In Progress, Completed, Deleted]
 *           optional: true
 *         Update_By:
 *           type: integer
 *           nullable: true
 *           optional: true
 *           example: 2
 *         Process_Id:
 *           type: integer
 *           nullable: true
 *           optional: true
 *           example: 501
 *         Parameters:
 *           type: array
 *           optional: true
 *           items:
 *             type: object
 *             properties:
 *               Param_Id:
 *                 type: integer
 *                 example: 5
 *               Default_Value:
 *                 type: string
 *                 nullable: true
 *                 example: "10"
 *               Current_Value:
 *                 type: string
 *                 nullable: true
 *                 example: "15"
 * 
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Validation failed"
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *                 example: "Work_Id"
 *               message:
 *                 type: string
 *                 example: "Work_Id is required"
 * 
 *   parameters:
 *     workMasterId:
 *       name: id
 *       in: path
 *       description: Work ID (Work_Id)
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *       example: 1001
 * 
 *     employeeId:
 *       name: empId
 *       in: path
 *       description: Employee ID
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *       example: 101
 * 
 *     taskId:
 *       name: taskId
 *       in: path
 *       description: Task ID
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *       example: 10
 * 
 *     pageQuery:
 *       name: page
 *       in: query
 *       description: Page number for pagination
 *       required: false
 *       schema:
 *         type: integer
 *         minimum: 1
 *         default: 1
 * 
 *     limitQuery:
 *       name: limit
 *       in: query
 *       description: Number of items per page
 *       required: false
 *       schema:
 *         type: integer
 *         minimum: 1
 *         maximum: 100
 *         default: 10
 * 
 *     searchQuery:
 *       name: search
 *       in: query
 *       description: Search term for Work_Done or Work_Status
 *       required: false
 *       schema:
 *         type: string
 * 
 *     empIdQuery:
 *       name: empId
 *       in: query
 *       description: Filter by Employee ID
 *       required: false
 *       schema:
 *         type: integer
 *         minimum: 1
 * 
 *     taskIdQuery:
 *       name: taskId
 *       in: query
 *       description: Filter by Task ID
 *       required: false
 *       schema:
 *         type: integer
 *         minimum: 1
 * 
 *     schIdQuery:
 *       name: schId
 *       in: query
 *       description: Filter by Schedule ID
 *       required: false
 *       schema:
 *         type: integer
 *         minimum: 1
 * 
 *     fromDateQuery:
 *       name: fromDate
 *       in: query
 *       description: Filter from date (YYYY-MM-DD)
 *       required: false
 *       schema:
 *         type: string
 *         format: date
 *         example: "2024-01-01"
 * 
 *     toDateQuery:
 *       name: toDate
 *       in: query
 *       description: Filter to date (YYYY-MM-DD)
 *       required: false
 *       schema:
 *         type: string
 *         format: date
 *         example: "2024-01-31"
 * 
 *     workStatusQuery:
 *       name: workStatus
 *       in: query
 *       description: Filter by work status
 *       required: false
 *       schema:
 *         type: string
 *         enum: [Pending, In Progress, Completed, Deleted]
 * 
 *     permanentDelete:
 *       name: permanent
 *       in: query
 *       description: Set to 'true' for permanent delete
 *       required: false
 *       schema:
 *         type: string
 *         enum: ['true', 'false']
 *         default: 'false'
 * 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// Public endpoints (no authentication required - optional based on your needs)

/**
 * @swagger
 * /api/masters/workMaster:
 *   get:
 *     summary: Get all works
 *     description: Retrieve all works with pagination and optional filtering
 *     tags: [WorkMaster]
 *     parameters:
 *       - $ref: '#/components/parameters/pageQuery'
 *       - $ref: '#/components/parameters/limitQuery'
 *       - $ref: '#/components/parameters/searchQuery'
 *       - $ref: '#/components/parameters/empIdQuery'
 *       - $ref: '#/components/parameters/taskIdQuery'
 *       - $ref: '#/components/parameters/schIdQuery'
 *       - $ref: '#/components/parameters/fromDateQuery'
 *       - $ref: '#/components/parameters/toDateQuery'
 *       - $ref: '#/components/parameters/workStatusQuery'
 *     responses:
 *       200:
 *         description: Successfully retrieved works
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/WorkMaster'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */
router.get('/', getAllWorks);

/**
 * @swagger
 * /api/masters/workMaster/active:
 *   get:
 *     summary: Get active works
 *     description: Retrieve all active (not deleted) works, optionally filtered by employee
 *     tags: [WorkMaster]
 *     parameters:
 *       - name: empId
 *         in: query
 *         description: Filter by employee ID
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Successfully retrieved active works
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WorkMaster'
 *       500:
 *         description: Internal server error
 */
router.get('/active', getActiveWorks);

/**
 * @swagger
 * /api/masters/workMaster/statistics:
 *   get:
 *     summary: Get work statistics
 *     description: Get statistics about works grouped by status
 *     tags: [WorkMaster]
 *     parameters:
 *       - $ref: '#/components/parameters/empIdQuery'
 *       - $ref: '#/components/parameters/fromDateQuery'
 *       - $ref: '#/components/parameters/toDateQuery'
 *     responses:
 *       200:
 *         description: Successfully retrieved statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       Work_Status:
 *                         type: string
 *                       count:
 *                         type: integer
 *                       totalMinutes:
 *                         type: integer
 *       500:
 *         description: Internal server error
 */
router.get('/statistics', getWorkStatistics);

/**
 * @swagger
 * /api/masters/workMaster/employee/{empId}:
 *   get:
 *     summary: Get works by employee ID
 *     description: Retrieve all works for a specific employee
 *     tags: [WorkMaster]
 *     parameters:
 *       - $ref: '#/components/parameters/employeeId'
 *     responses:
 *       200:
 *         description: Successfully retrieved works by employee
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WorkMaster'
 *       400:
 *         description: Invalid employee ID
 *       404:
 *         description: No works found for this employee
 *       500:
 *         description: Internal server error
 */
router.get('/employee/:empId', getWorksByEmployeeId);

/**
 * @swagger
 * /api/masters/workMaster/task/{taskId}:
 *   get:
 *     summary: Get works by task ID
 *     description: Retrieve all works for a specific task
 *     tags: [WorkMaster]
 *     parameters:
 *       - $ref: '#/components/parameters/taskId'
 *     responses:
 *       200:
 *         description: Successfully retrieved works by task
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WorkMaster'
 *       400:
 *         description: Invalid task ID
 *       404:
 *         description: No works found for this task
 *       500:
 *         description: Internal server error
 */
router.get('/task/:taskId', getWorksByTaskId);

/**
 * @swagger
 * /api/masters/workMaster/{id}:
 *   get:
 *     summary: Get work by ID
 *     description: Retrieve a specific work by its Work_Id
 *     tags: [WorkMaster]
 *     parameters:
 *       - $ref: '#/components/parameters/workMasterId'
 *     responses:
 *       200:
 *         description: Successfully retrieved work
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/WorkMaster'
 *       400:
 *         description: Invalid ID parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Work not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Work with ID 1001 not found"
 *       500:
 *         description: Internal server error
 */
router.get('/:id', getWorkByWorkId);

// Protected endpoints (require authentication and authorization)

/**
 * @swagger
 * /api/masters/workMaster:
 *   post:
 *     summary: Create a new work
 *     description: Create a new work record with optional parameters
 *     tags: [WorkMaster]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkMasterCreate'
 *     responses:
 *       201:
 *         description: Work created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/WorkMaster'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - No token provided
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       409:
 *         description: Conflict - Work with this ID already exists
 *       500:
 *         description: Internal server error
 */
router.post('/',
    authenticate,
    authorize([1, 2]),
    createWorkMaster
);

/**
 * @swagger
 * /api/masters/workMaster/bulk:
 *   post:
 *     summary: Bulk create works
 *     description: Create multiple works at once
 *     tags: [WorkMaster]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/WorkMasterCreate'
 *     responses:
 *       201:
 *         description: Works created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WorkMaster'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       409:
 *         description: Conflict - Some work IDs already exist
 *       500:
 *         description: Internal server error
 */
router.post('/bulk',
    authenticate,
    authorize([1, 2]),
    bulkCreateWorkMaster
);

/**
 * @swagger
 * /api/masters/workMaster/{id}:
 *   put:
 *     summary: Update a work
 *     description: Update an existing work by ID
 *     tags: [WorkMaster]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/workMasterId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkMasterUpdate'
 *     responses:
 *       200:
 *         description: Work updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/WorkMaster'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Work not found
 *       409:
 *         description: Conflict - Another work with this ID already exists
 *       500:
 *         description: Internal server error
 */
router.put('/:id',
    authenticate,
    authorize([1, 2]),
    updateWorkMaster
);

/**
 * @swagger
 * /api/masters/workMaster/{id}/restore:
 *   patch:
 *     summary: Restore a deleted work
 *     description: Restore a soft-deleted work by ID
 *     tags: [WorkMaster]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/workMasterId'
 *     responses:
 *       200:
 *         description: Work restored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/WorkMaster'
 *       400:
 *         description: Invalid ID parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Deleted work not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id/restore',
    authenticate,
    authorize([1]),
    restoreWorkMaster
);

/**
 * @swagger
 * /api/masters/workMaster/{id}:
 *   delete:
 *     summary: Delete a work (soft delete)
 *     description: Soft delete a work by setting Work_Status = 'Deleted'
 *     tags: [WorkMaster]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/workMasterId'
 *     responses:
 *       200:
 *         description: Work deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid ID parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Work not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id',
    authenticate,
    authorize([1]),
    deleteWorkMaster
);

/**
 * @swagger
 * /api/masters/workMaster/{id}/hard:
 *   delete:
 *     summary: Permanently delete a work
 *     description: Permanently delete a work and its parameters from the database (hard delete)
 *     tags: [WorkMaster]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/workMasterId'
 *     responses:
 *       200:
 *         description: Work permanently deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid ID parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Work not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id/hard',
    authenticate,
    authorize([1]),
    hardDeleteWorkMaster
);

export default router;