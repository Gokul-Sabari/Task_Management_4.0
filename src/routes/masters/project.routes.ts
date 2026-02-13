import express from 'express';
import {
    getAllProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    getActiveProjects
} from '../../controllers/masters/taskManagement/projectType.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ProjectMaster
 *   description: Project Master management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ProjectMaster:
 *       type: object
 *       properties:
 *         Project_Id:
 *           type: integer
 *           readOnly: true
 *         Project_Name:
 *           type: string
 *           nullable: true
 *         Project_Desc:
 *           type: string
 *           nullable: true
 *         Company_id:
 *           type: integer
 *           nullable: true
 *         Project_Head:
 *           type: integer
 *           nullable: true
 *         Est_Start_Dt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         Est_End_Dt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         Project_Status:
 *           type: string
 *           nullable: true
 *         Entry_By:
 *           type: string
 *           nullable: true
 *         Entry_Date:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         Update_By:
 *           type: string
 *           nullable: true
 *         Update_Date:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         IsActive:
 *           type: boolean
 *           nullable: true
 *         Del_Flag:
 *           type: integer
 *           nullable: true
 *           default: 0
 * 
 *     ProjectMasterCreate:
 *       type: object
 *       properties:
 *         Project_Name:
 *           type: string
 *           nullable: true
 *         Project_Desc:
 *           type: string
 *           nullable: true
 *         Company_id:
 *           type: integer
 *           nullable: true
 *         Project_Head:
 *           type: integer
 *           nullable: true
 *         Est_Start_Dt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         Est_End_Dt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         Project_Status:
 *           type: string
 *           nullable: true
 *         Entry_By:
 *           type: string
 *           nullable: true
 *         Entry_Date:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         Update_By:
 *           type: string
 *           nullable: true
 *         Update_Date:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         IsActive:
 *           type: boolean
 *           nullable: true
 * 
 *     ProjectMasterUpdate:
 *       type: object
 *       properties:
 *         Project_Name:
 *           type: string
 *           nullable: true
 *         Project_Desc:
 *           type: string
 *           nullable: true
 *         Company_id:
 *           type: integer
 *           nullable: true
 *         Project_Head:
 *           type: integer
 *           nullable: true
 *         Est_Start_Dt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         Est_End_Dt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         Project_Status:
 *           type: string
 *           nullable: true
 *         Entry_By:
 *           type: string
 *           nullable: true
 *         Entry_Date:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         Update_By:
 *           type: string
 *           nullable: true
 *         Update_Date:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         IsActive:
 *           type: boolean
 *           nullable: true
 *         Del_Flag:
 *           type: integer
 *           nullable: true
 * 
 *     Pagination:
 *       type: object
 *       properties:
 *         totalRecords:
 *           type: integer
 *           example: 150
 *         currentPage:
 *           type: integer
 *           example: 1
 *         totalPages:
 *           type: integer
 *           example: 8
 *         pageSize:
 *           type: integer
 *           example: 20
 *         hasNextPage:
 *           type: boolean
 *           example: true
 *         hasPreviousPage:
 *           type: boolean
 *           example: false
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
 *                 example: "Project_Name"
 *               message:
 *                 type: string
 *                 example: "Project name is required"
 * 
 *   parameters:
 *     projectId:
 *       name: id
 *       in: path
 *       description: Project ID
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *       example: 1
 * 
 *     paginationPage:
 *       name: page
 *       in: query
 *       description: Page number
 *       required: false
 *       schema:
 *         type: integer
 *         minimum: 1
 *         default: 1
 *       example: 1
 * 
 *     paginationLimit:
 *       name: limit
 *       in: query
 *       description: Items per page (max 100)
 *       required: false
 *       schema:
 *         type: integer
 *         minimum: 1
 *         maximum: 100
 *         default: 20
 *       example: 20
 * 
 *     searchQuery:
 *       name: search
 *       in: query
 *       description: Search by project name, description, status, or ID
 *       required: false
 *       schema:
 *         type: string
 * 
 *     projectNameFilter:
 *       name: Project_Name
 *       in: query
 *       description: Filter by project name
 *       required: false
 *       schema:
 *         type: string
 * 
 *     projectStatusFilter:
 *       name: Project_Status
 *       in: query
 *       description: Filter by project status
 *       required: false
 *       schema:
 *         type: string
 * 
 *     companyIdFilter:
 *       name: Company_id
 *       in: query
 *       description: Filter by company ID
 *       required: false
 *       schema:
 *         type: integer
 * 
 *     sortByParam:
 *       name: sortBy
 *       in: query
 *       description: Sort field
 *       required: false
 *       schema:
 *         type: string
 *         enum: ["Project_Id", "Project_Name", "Project_Status", "Company_id", "Est_Start_Dt", "Est_End_Dt"]
 *         default: "Project_Id"
 * 
 *     sortOrderParam:
 *       name: sortOrder
 *       in: query
 *       description: Sort order
 *       required: false
 *       schema:
 *         type: string
 *         enum: ["ASC", "DESC"]
 *         default: "ASC"
 * 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/masters/project:
 *   get:
 *     summary: Get all projects with pagination and filtering
 *     description: Retrieve a paginated list of projects with optional filtering and search
 *     tags: [ProjectMaster]
 *     parameters:
 *       - $ref: '#/components/parameters/paginationPage'
 *       - $ref: '#/components/parameters/paginationLimit'
 *       - $ref: '#/components/parameters/searchQuery'
 *       - $ref: '#/components/parameters/projectNameFilter'
 *       - $ref: '#/components/parameters/projectStatusFilter'
 *       - $ref: '#/components/parameters/companyIdFilter'
 *       - $ref: '#/components/parameters/sortByParam'
 *       - $ref: '#/components/parameters/sortOrderParam'
 *     responses:
 *       200:
 *         description: Successfully retrieved projects
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
 *                     $ref: '#/components/schemas/ProjectMaster'
 *                 metadata:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */
router.get('/', getAllProjects);

/**
 * @swagger
 * /api/masters/project/active:
 *   get:
 *     summary: Get all active projects
 *     description: Retrieve all active projects (where Del_Flag = 0 and IsActive = true)
 *     tags: [ProjectMaster]
 *     responses:
 *       200:
 *         description: Successfully retrieved active projects
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
 *                     $ref: '#/components/schemas/ProjectMaster'
 *       500:
 *         description: Internal server error
 */
router.get('/active', getActiveProjects);

/**
 * @swagger
 * /api/masters/project/{id}:
 *   get:
 *     summary: Get project by ID
 *     description: Retrieve a specific project by its ID
 *     tags: [ProjectMaster]
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *     responses:
 *       200:
 *         description: Successfully retrieved project
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
 *                   $ref: '#/components/schemas/ProjectMaster'
 *       400:
 *         description: Invalid ID parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Project not found
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
 *                   example: "Project not found"
 *       500:
 *         description: Internal server error
 */
router.get('/:id', getProjectById);

/**
 * @swagger
 * /api/masters/project:
 *   post:
 *     summary: Create a new project
 *     description: Create a new project record
 *     tags: [ProjectMaster]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProjectMasterCreate'
 *     responses:
 *       201:
 *         description: Project created successfully
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
 *                   $ref: '#/components/schemas/ProjectMaster'
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
 *         description: Conflict - Project name already exists
 *       500:
 *         description: Internal server error
 */
router.post('/',
    authenticate,
    authorize([1, 2]),
    createProject
);

/**
 * @swagger
 * /api/masters/project/{id}:
 *   put:
 *     summary: Update a project
 *     description: Update an existing project by ID
 *     tags: [ProjectMaster]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProjectMasterUpdate'
 *     responses:
 *       200:
 *         description: Project updated successfully
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
 *                   $ref: '#/components/schemas/ProjectMaster'
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
 *         description: Project not found
 *       409:
 *         description: Conflict - Project name already exists
 *       500:
 *         description: Internal server error
 */
router.put('/:id',
    authenticate,
    authorize([1, 2]), 
    updateProject
);

/**
 * @swagger
 * /api/masters/project/{id}:
 *   delete:
 *     summary: Delete a project (soft delete)
 *     description: Soft delete a project by setting Del_Flag to 1
 *     tags: [ProjectMaster]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *     responses:
 *       200:
 *         description: Project deleted successfully
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
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id',
    authenticate,
    authorize([1]), 
    deleteProject
);

export default router;