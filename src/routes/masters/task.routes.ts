import express from 'express';
import {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    getTasksByProject,
    getTasksByCompany,
    getTasksByTaskGroup,
    getTasksWithNoCompany,
    getTasksWithNoProject
} from '../../controllers/masters/taskManagement/task.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       required:
 *         - Task_Name
 *         - Task_Group_Id
 *       properties:
 *         Task_Id:
 *           type: integer
 *           readOnly: true
 *         Task_Name:
 *           type: string
 *           maxLength: 255
 *           example: "SMT EXPENSES CHECKING (FRIEGHT, COOLIE, MAMUL)"
 *         Task_Desc:
 *           type: string
 *           nullable: true
 *           example: "SMT EXPENSES CHECKING"
 *         Company_Id:
 *           type: integer
 *           nullable: true
 *           example: null
 *         Task_Group_Id:
 *           type: integer
 *           example: 2
 *         Entry_By:
 *           type: integer
 *           example: 1
 *         Entry_Date:
 *           type: string
 *           format: date-time
 *           example: "2024-10-18T19:20:33.710Z"
 *         Update_By:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         Update_Date:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2024-12-16T13:26:12.240Z"
 *         Project_Id:
 *           type: integer
 *           nullable: true
 *           example: null
 * 
 *     TaskCreate:
 *       type: object
 *       required:
 *         - Task_Name
 *         - Task_Group_Id
 *       properties:
 *         Task_Name:
 *           type: string
 *           maxLength: 255
 *           example: "New Task Name"
 *         Task_Desc:
 *           type: string
 *           nullable: true
 *        Company_Id:
 *           type: integer
 *           nullable: true
 *         Task_Group_Id:
 *           type: integer
 *           example: 2
 *         Project_Id:
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
 *                 example: "Task_Name"
 *               message:
 *                 type: string
 *                 example: "Task_Name is required"
 * 
 *   parameters:
 *     taskId:
 *       name: id
 *       in: path
 *       description: Task ID
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *       example: 66
 * 
 *     projectId:
 *       name: projectId
 *       in: path
 *       description: Project ID
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *       example: 1
 * 
 *     companyId:
 *       name: companyId
 *       in: path
 *       description: Company ID
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *       example: 1
 * 
 *     taskGroupId:
 *       name: taskGroupId
 *       in: path
 *       description: Task Group ID
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *       example: 2
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
 *       description: Search by task name or description
 *       required: false
 *       schema:
 *         type: string
 * 
 *     sortByParam:
 *       name: sortBy
 *       in: query
 *       description: Sort field
 *       required: false
 *       schema:
 *         type: string
 *         enum: ["Task_Id", "Task_Name", "Entry_Date", "Update_Date"]
 *         default: "Task_Id"
 * 
 *     sortOrderParam:
 *       name: sortOrder
 *       in: query
 *       description: Sort order
 *       required: false
 *       schema:
 *         type: string
 *         enum: ["ASC", "DESC"]
 *         default: "DESC"
 * 
 *     companyIdQuery:
 *       name: Company_Id
 *       in: query
 *       description: Filter by company ID
 *       required: false
 *       schema:
 *         type: integer
 * 
 *     taskGroupIdQuery:
 *       name: task_group_id
 *       in: query
 *       description: Filter by task group ID
 *       required: false
 *       schema:
 *         type: integer
 * 
 *     projectIdQuery:
 *       name: project_id
 *       in: query
 *       description: Filter by project ID
 *       required: false
 *       schema:
 *         type: integer
 * 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/masters/tasks:
 *   get:
 *     summary: Get all tasks with pagination and filtering
 *     description: Retrieve a paginated list of tasks with optional filtering and search
 *     tags: [Tasks]
 *     parameters:
 *       - $ref: '#/components/parameters/paginationPage'
 *       - $ref: '#/components/parameters/paginationLimit'
 *       - $ref: '#/components/parameters/searchQuery'
 *       - $ref: '#/components/parameters/companyIdQuery'
 *       - $ref: '#/components/parameters/taskGroupIdQuery'
 *       - $ref: '#/components/parameters/projectIdQuery'
 *       - $ref: '#/components/parameters/sortByParam'
 *       - $ref: '#/components/parameters/sortOrderParam'
 *     responses:
 *       200:
 *         description: Successfully retrieved tasks
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
 *                     $ref: '#/components/schemas/Task'
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
router.get('/', getAllTasks);

/**
 * @swagger
 * /api/masters/tasks/no-company:
 *   get:
 *     summary: Get tasks with no company
 *     description: Retrieve tasks that are not assigned to any company
 *     tags: [Tasks]
 *     responses:
 *       200:
 *         description: Successfully retrieved tasks with no company
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
 *                     $ref: '#/components/schemas/Task'
 *       500:
 *         description: Internal server error
 */
router.get('/no-company', getTasksWithNoCompany);

/**
 * @swagger
 * /api/masters/tasks/no-project:
 *   get:
 *     summary: Get tasks with no project
 *     description: Retrieve tasks that are not assigned to any project
 *     tags: [Tasks]
 *     responses:
 *       200:
 *         description: Successfully retrieved tasks with no project
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
 *                     $ref: '#/components/schemas/Task'
 *       500:
 *         description: Internal server error
 */
router.get('/no-project', getTasksWithNoProject);

/**
 * @swagger
 * /api/masters/tasks/project/{projectId}:
 *   get:
 *     summary: Get tasks by project ID
 *     description: Retrieve all tasks for a specific project
 *     tags: [Tasks]
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *     responses:
 *       200:
 *         description: Successfully retrieved tasks by project
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
 *                     $ref: '#/components/schemas/Task'
 *       400:
 *         description: Invalid project ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId', getTasksByProject);

/**
 * @swagger
 * /api/masters/tasks/company/{companyId}:
 *   get:
 *     summary: Get tasks by company ID
 *     description: Retrieve all tasks for a specific company
 *     tags: [Tasks]
 *     parameters:
 *       - $ref: '#/components/parameters/companyId'
 *     responses:
 *       200:
 *         description: Successfully retrieved tasks by company
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
 *                     $ref: '#/components/schemas/Task'
 *       400:
 *         description: Invalid company ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */
router.get('/company/:companyId', getTasksByCompany);

/**
 * @swagger
 * /api/masters/tasks/task-group/{taskGroupId}:
 *   get:
 *     summary: Get tasks by task group ID
 *     description: Retrieve all tasks for a specific task group
 *     tags: [Tasks]
 *     parameters:
 *       - $ref: '#/components/parameters/taskGroupId'
 *     responses:
 *       200:
 *         description: Successfully retrieved tasks by task group
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
 *                     $ref: '#/components/schemas/Task'
 *       400:
 *         description: Invalid task group ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */
router.get('/task-group/:taskGroupId', getTasksByTaskGroup);

/**
 * @swagger
 * /api/masters/tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     description: Retrieve a specific task by its ID
 *     tags: [Tasks]
 *     parameters:
 *       - $ref: '#/components/parameters/taskId'
 *     responses:
 *       200:
 *         description: Successfully retrieved task
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
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Invalid ID parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Task not found
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
 *                   example: "Task not found"
 *       500:
 *         description: Internal server error
 */
router.get('/:id', getTaskById);

/**
 * @swagger
 * /api/masters/tasks:
 *   post:
 *     summary: Create a new task
 *     description: Create a new task record
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskCreate'
 *     responses:
 *       201:
 *         description: Task created successfully
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
 *                   $ref: '#/components/schemas/Task'
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
 *         description: Conflict - Task already exists in the group
 *       500:
 *         description: Internal server error
 */
router.post('/',
    authenticate,
    authorize([1, 2]),
    createTask
);

/**
 * @swagger
 * /api/masters/tasks/{id}:
 *   put:
 *     summary: Update a task
 *     description: Update an existing task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/taskId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskUpdate'
 *     responses:
 *       200:
 *         description: Task updated successfully
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
 *                   $ref: '#/components/schemas/Task'
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
 *         description: Task not found
 *       409:
 *         description: Conflict - Task with this name already exists in the group
 *       500:
 *         description: Internal server error
 */
router.put('/:id',
    authenticate,
    authorize([1, 2]),
    updateTask
);

/**
 * @swagger
 * /api/masters/tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     description: Delete a task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/taskId'
 *     responses:
 *       200:
 *         description: Task deleted successfully
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
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id',
    authenticate,
    authorize([1]),
    deleteTask
);

export default router;