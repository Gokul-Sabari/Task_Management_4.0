import express from 'express';
import {
    getAllWorkParameters,
    getWorkParameterById,
    createWorkParameter,
    updateWorkParameter,
    deleteWorkParameter,
    getParametersByWorkId,
    getParametersByTaskId,
    getParametersByParamId,
    bulkCreateWorkParameters
} from '../../controllers/masters/taskManagement/workParameter.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: WorkParameters
 *   description: Work Parameter management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     WorkParameter:
 *       type: object
 *       required:
 *         - Work_Id
 *         - Task_Id
 *         - Param_Id
 *       properties:
 *         WNo:
 *           type: integer
 *           readOnly: true
 *           example: 1
 *         Work_Id:
 *           type: integer
 *           minimum: 1
 *           example: 1001
 *         Task_Id:
 *           type: integer
 *           minimum: 1
 *           example: 10
 *         Param_Id:
 *           type: integer
 *           minimum: 1
 *           example: 5
 *         Default_Value:
 *           type: string
 *           nullable: true
 *           example: "10"
 *         Current_Value:
 *           type: string
 *           nullable: true
 *           example: "15"
 *         workMaster:
 *           type: object
 *           properties:
 *             Work_Dt:
 *               type: string
 *               format: date
 *               example: "2024-01-15"
 *             Work_Status:
 *               type: string
 *               example: "Completed"
 * 
 *     WorkParameterCreate:
 *       type: object
 *       required:
 *         - Work_Id
 *         - Task_Id
 *         - Param_Id
 *       properties:
 *         Work_Id:
 *           type: integer
 *           minimum: 1
 *           example: 1001
 *         Task_Id:
 *           type: integer
 *           minimum: 1
 *           example: 10
 *         Param_Id:
 *           type: integer
 *           minimum: 1
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
 *     WorkParameterUpdate:
 *       type: object
 *       properties:
 *         Work_Id:
 *           type: integer
 *           minimum: 1
 *           optional: true
 *           example: 1001
 *         Task_Id:
 *           type: integer
 *           minimum: 1
 *           optional: true
 *           example: 10
 *         Param_Id:
 *           type: integer
 *           minimum: 1
 *           optional: true
 *           example: 5
 *         Default_Value:
 *           type: string
 *           nullable: true
 *           optional: true
 *           example: "10"
 *         Current_Value:
 *           type: string
 *           nullable: true
 *           optional: true
 *           example: "15"
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
 *     workParameterId:
 *       name: id
 *       in: path
 *       description: Work Parameter ID (WNo)
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *       example: 1
 * 
 *     workId:
 *       name: workId
 *       in: path
 *       description: Work ID
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *       example: 1001
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
 *     paramId:
 *       name: paramId
 *       in: path
 *       description: Parameter ID
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *       example: 5
 * 
 *     workIdQuery:
 *       name: workId
 *       in: query
 *       description: Filter by Work ID
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
 *     paramIdQuery:
 *       name: paramId
 *       in: query
 *       description: Filter by Parameter ID
 *       required: false
 *       schema:
 *         type: integer
 *         minimum: 1
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
 *       description: Search term for Default_Value or Current_Value
 *       required: false
 *       schema:
 *         type: string
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
 * /api/masters/workParameter:
 *   get:
 *     summary: Get all work parameters
 *     description: Retrieve all work parameters with pagination and optional filtering
 *     tags: [WorkParameters]
 *     parameters:
 *       - $ref: '#/components/parameters/pageQuery'
 *       - $ref: '#/components/parameters/limitQuery'
 *       - $ref: '#/components/parameters/searchQuery'
 *       - $ref: '#/components/parameters/workIdQuery'
 *       - $ref: '#/components/parameters/taskIdQuery'
 *       - $ref: '#/components/parameters/paramIdQuery'
 *     responses:
 *       200:
 *         description: Successfully retrieved work parameters
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
 *                         $ref: '#/components/schemas/WorkParameter'
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
router.get('/', getAllWorkParameters);

/**
 * @swagger
 * /api/masters/workParameter/work/{workId}:
 *   get:
 *     summary: Get parameters by Work ID
 *     description: Retrieve all parameters for a specific work
 *     tags: [WorkParameters]
 *     parameters:
 *       - $ref: '#/components/parameters/workId'
 *     responses:
 *       200:
 *         description: Successfully retrieved parameters by work ID
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
 *                     $ref: '#/components/schemas/WorkParameter'
 *       400:
 *         description: Invalid work ID
 *       404:
 *         description: No parameters found for this work
 *       500:
 *         description: Internal server error
 */
router.get('/work/:workId', getParametersByWorkId);

/**
 * @swagger
 * /api/masters/workParameter/task/{taskId}:
 *   get:
 *     summary: Get parameters by Task ID
 *     description: Retrieve all parameters for a specific task
 *     tags: [WorkParameters]
 *     parameters:
 *       - $ref: '#/components/parameters/taskId'
 *     responses:
 *       200:
 *         description: Successfully retrieved parameters by task ID
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
 *                     $ref: '#/components/schemas/WorkParameter'
 *       400:
 *         description: Invalid task ID
 *       404:
 *         description: No parameters found for this task
 *       500:
 *         description: Internal server error
 */
router.get('/task/:taskId', getParametersByTaskId);

/**
 * @swagger
 * /api/masters/workParameter/param/{paramId}:
 *   get:
 *     summary: Get parameters by Parameter ID
 *     description: Retrieve all parameters for a specific parameter ID
 *     tags: [WorkParameters]
 *     parameters:
 *       - $ref: '#/components/parameters/paramId'
 *     responses:
 *       200:
 *         description: Successfully retrieved parameters by parameter ID
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
 *                     $ref: '#/components/schemas/WorkParameter'
 *       400:
 *         description: Invalid parameter ID
 *       404:
 *         description: No parameters found for this parameter ID
 *       500:
 *         description: Internal server error
 */
router.get('/param/:paramId', getParametersByParamId);

/**
 * @swagger
 * /api/masters/workParameter/{id}:
 *   get:
 *     summary: Get work parameter by ID
 *     description: Retrieve a specific work parameter by its WNo
 *     tags: [WorkParameters]
 *     parameters:
 *       - $ref: '#/components/parameters/workParameterId'
 *     responses:
 *       200:
 *         description: Successfully retrieved work parameter
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
 *                   $ref: '#/components/schemas/WorkParameter'
 *       400:
 *         description: Invalid ID parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Work parameter not found
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
 *                   example: "Work parameter not found"
 *       500:
 *         description: Internal server error
 */
router.get('/:id', getWorkParameterById);

// Protected endpoints (require authentication and authorization)

/**
 * @swagger
 * /api/masters/workParameter:
 *   post:
 *     summary: Create a new work parameter
 *     description: Create a new work parameter record
 *     tags: [WorkParameters]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkParameterCreate'
 *     responses:
 *       201:
 *         description: Work parameter created successfully
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
 *                   $ref: '#/components/schemas/WorkParameter'
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
 *         description: Conflict - Parameter combination already exists
 *       500:
 *         description: Internal server error
 */
router.post('/',
    authenticate,
    authorize([1, 2]),
    createWorkParameter
);

/**
 * @swagger
 * /api/masters/workParameter/bulk:
 *   post:
 *     summary: Bulk create work parameters
 *     description: Create multiple work parameters at once
 *     tags: [WorkParameters]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/WorkParameterCreate'
 *     responses:
 *       201:
 *         description: Work parameters created successfully
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
 *                     $ref: '#/components/schemas/WorkParameter'
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
 *         description: Conflict - Some parameter combinations already exist
 *       500:
 *         description: Internal server error
 */
router.post('/bulk',
    authenticate,
    authorize([1, 2]),
    bulkCreateWorkParameters
);

/**
 * @swagger
 * /api/masters/workParameter/{id}:
 *   put:
 *     summary: Update a work parameter
 *     description: Update an existing work parameter by ID
 *     tags: [WorkParameters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/workParameterId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkParameterUpdate'
 *     responses:
 *       200:
 *         description: Work parameter updated successfully
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
 *                   $ref: '#/components/schemas/WorkParameter'
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
 *         description: Work parameter not found
 *       409:
 *         description: Conflict - Parameter combination already exists
 *       500:
 *         description: Internal server error
 */
router.put('/:id',
    authenticate,
    authorize([1, 2]),
    updateWorkParameter
);

/**
 * @swagger
 * /api/masters/workParameter/{id}:
 *   delete:
 *     summary: Delete a work parameter
 *     description: Permanently delete a work parameter from the database
 *     tags: [WorkParameters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/workParameterId'
 *     responses:
 *       200:
 *         description: Work parameter deleted successfully
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
 *         description: Work parameter not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id',
    authenticate,
    authorize([1]),
    deleteWorkParameter
);

export default router;