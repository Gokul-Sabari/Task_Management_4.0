// src/routes/masters/projectSchedule/projectSchedule.routes.ts
import express from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import {
    createSchedule,
    deleteSchedule,
    getAllSchedules,
    getScheduleById,
    getScheduleDropdown,    
    updateSchedule,
    getSchedulePlansDropdown,
    getTasksDropdown,
    getScheduleTypesDropdown,
    getScheduleDetails,
    updateScheduleStatus
} from '../../controllers/masters/taskManagement/projectScedule.controller';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Project Schedule
 *   description: Project Schedule management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ProjectSchedule:
 *       type: object
 *       properties:
 *         Sch_Id:
 *           type: integer
 *           readOnly: true
 *           example: 1
 *         Sch_No:
 *           type: string
 *           maxLength: 50
 *           example: "SCH-2024-001"
 *         Sch_Date:
 *           type: string
 *           format: date
 *           example: "2024-01-15"
 *         Task_Id:
 *           type: integer
 *           example: 5
 *         Task_Name:
 *           type: string
 *           example: "Website Development"
 *         Sch_Type_Id:
 *           type: integer
 *           example: 1
 *         Sch_Plan_Id:
 *           type: integer
 *           example: 2
 *         Plan_Type:
 *           type: string
 *           example: "Weekly Based"
 *         Sch_Start_Date:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: "2024-01-20"
 *         Sch_End_Date:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: "2024-01-25"
 *         Task_Sch_Timer_Based:
 *           type: boolean
 *           example: false
 *         Sch_Est_Start_Time:
 *           type: string
 *           format: time
 *           nullable: true
 *           example: "09:00"
 *         Sch_Est_End_Time:
 *           type: string
 *           format: time
 *           nullable: true
 *           example: "18:00"
 *         Task_Sch_Duaration:
 *           type: integer
 *           nullable: true
 *           example: 8
 *         Sch_Status:
 *           type: string
 *           enum: ["Active", "Completed", "Cancelled", "On Hold"]
 *           example: "Active"
 *         Entry_By:
 *           type: integer
 *           example: 1
 *         Entry_Date:
 *           type: string
 *           format: date-time
 *         Update_By:
 *           type: integer
 *           nullable: true
 *           example: 2
 *         Update_Date:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         Sch_Del_Flag:
 *           type: boolean
 *           example: false
 *
 *     ScheduleDetail:
 *       type: object
 *       properties:
 *         A_Id:
 *           type: integer
 *           readOnly: true
 *         Sch_Id:
 *           type: integer
 *         Task_Work_Date:
 *           type: string
 *           format: date
 *         Task_Start_Time:
 *           type: string
 *           format: time
 *         Task_End_Time:
 *           type: string
 *           format: time
 *
 *     SchedulePlanDetail:
 *       type: object
 *       properties:
 *         Sch_Id:
 *           type: integer
 *         Plan_Week:
 *           type: integer
 *           nullable: true
 *           minimum: 1
 *           maximum: 52
 *           example: 3
 *         Plan_Month:
 *           type: integer
 *           nullable: true
 *           minimum: 1
 *           maximum: 12
 *           example: 6
 *         Plan_Day:
 *           type: integer
 *           nullable: true
 *           minimum: 1
 *           maximum: 7
 *           example: 1
 *
 *     CompleteSchedule:
 *       type: object
 *       properties:
 *         schedule:
 *           $ref: '#/components/schemas/ProjectSchedule'
 *         scheduleDetails:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ScheduleDetail'
 *         planDetails:
 *           $ref: '#/components/schemas/SchedulePlanDetail'
 *
 *     ScheduleCreate:
 *       type: object
 *       required:
 *         - Sch_No
 *         - Sch_Date
 *         - Task_Id
 *         - Sch_Type_Id
 *         - Sch_Plan_Id
 *         - Sch_Status
 *       properties:
 *         Sch_No:
 *           type: string
 *           maxLength: 50
 *           example: "SCH-2024-001"
 *         Sch_Date:
 *           type: string
 *           format: date
 *           example: "2024-01-15"
 *         Task_Id:
 *           type: integer
 *           example: 5
 *         Sch_Type_Id:
 *           type: integer
 *           example: 1
 *         Sch_Plan_Id:
 *           type: integer
 *           example: 2
 *         Sch_Start_Date:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: "2024-01-20"
 *         Sch_End_Date:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: "2024-01-25"
 *         Task_Sch_Timer_Based:
 *           type: boolean
 *           default: false
 *         Sch_Est_Start_Time:
 *           type: string
 *           format: time
 *           nullable: true
 *           example: "09:00"
 *         Sch_Est_End_Time:
 *           type: string
 *           format: time
 *           nullable: true
 *           example: "18:00"
 *         Task_Sch_Duaration:
 *           type: integer
 *           nullable: true
 *           example: 8
 *         Sch_Status:
 *           type: string
 *           enum: ["Active", "Completed", "Cancelled", "On Hold"]
 *           example: "Active"
 *         Entry_By:
 *           type: integer
 *           example: 1
 *         planDetails:
 *           type: object
 *           properties:
 *             Plan_Week:
 *               type: integer
 *               nullable: true
 *             Plan_Month:
 *               type: integer
 *               nullable: true
 *             Plan_Day:
 *               type: integer
 *               nullable: true
 *
 *     ScheduleUpdate:
 *       type: object
 *       required:
 *         - Sch_No
 *         - Sch_Date
 *         - Task_Id
 *         - Sch_Type_Id
 *         - Sch_Plan_Id
 *         - Sch_Status
 *       properties:
 *         Sch_No:
 *           type: string
 *           maxLength: 50
 *           example: "SCH-2024-001-Updated"
 *         Sch_Date:
 *           type: string
 *           format: date
 *           example: "2024-01-15"
 *         Task_Id:
 *           type: integer
 *           example: 5
 *         Sch_Type_Id:
 *           type: integer
 *           example: 1
 *         Sch_Plan_Id:
 *           type: integer
 *           example: 2
 *         Sch_Start_Date:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: "2024-01-20"
 *         Sch_End_Date:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: "2024-01-25"
 *         Task_Sch_Timer_Based:
 *           type: boolean
 *           example: false
 *         Sch_Est_Start_Time:
 *           type: string
 *           format: time
 *           nullable: true
 *           example: "09:00"
 *         Sch_Est_End_Time:
 *           type: string
 *           format: time
 *           nullable: true
 *           example: "18:00"
 *         Task_Sch_Duaration:
 *           type: integer
 *           nullable: true
 *           example: 8
 *         Sch_Status:
 *           type: string
 *           enum: ["Active", "Completed", "Cancelled", "On Hold"]
 *           example: "Active"
 *         Update_By:
 *           type: integer
 *           example: 2
 *         planDetails:
 *           type: object
 *           properties:
 *             Plan_Week:
 *               type: integer
 *               nullable: true
 *             Plan_Month:
 *               type: integer
 *               nullable: true
 *             Plan_Day:
 *               type: integer
 *               nullable: true
 *
 *     StatusUpdate:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: ["Active", "Completed", "Cancelled", "On Hold"]
 *           example: "Completed"
 *         Update_By:
 *           type: integer
 *           example: 2
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
 *                 example: "Sch_No"
 *               message:
 *                 type: string
 *                 example: "Schedule number is required"
 *
 *   parameters:
 *     scheduleId:
 *       name: id
 *       in: path
 *       description: Project Schedule ID
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
 *       description: Search by schedule number or task name
 *       required: false
 *       schema:
 *         type: string
 *
 *     statusFilter:
 *       name: status
 *       in: query
 *       description: Filter by schedule status
 *       required: false
 *       schema:
 *         type: string
 *         enum: ["Active", "Completed", "Cancelled", "On Hold"]
 *
 *     planTypeFilter:
 *       name: planType
 *       in: query
 *       description: Filter by plan type ID
 *       required: false
 *       schema:
 *         type: integer
 *
 *     taskFilter:
 *       name: taskId
 *       in: query
 *       description: Filter by task ID
 *       required: false
 *       schema:
 *         type: integer
 *
 *     dateFromFilter:
 *       name: dateFrom
 *       in: query
 *       description: Filter schedules from this date
 *       required: false
 *       schema:
 *         type: string
 *         format: date
 *
 *     dateToFilter:
 *       name: dateTo
 *       in: query
 *       description: Filter schedules up to this date
 *       required: false
 *       schema:
 *         type: string
 *         format: date
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/masters/projectSchedule:
 *   get:
 *     summary: Get all project schedules with pagination and filtering
 *     description: Retrieve a paginated list of project schedules with optional search and filters
 *     tags: [Project Schedule]
 *     parameters:
 *       - $ref: '#/components/parameters/paginationPage'
 *       - $ref: '#/components/parameters/paginationLimit'
 *       - $ref: '#/components/parameters/searchQuery'
 *       - $ref: '#/components/parameters/statusFilter'
 *       - $ref: '#/components/parameters/planTypeFilter'
 *       - $ref: '#/components/parameters/taskFilter'
 *       - $ref: '#/components/parameters/dateFromFilter'
 *       - $ref: '#/components/parameters/dateToFilter'
 *       - name: sortBy
 *         in: query
 *         description: Sort field
 *         required: false
 *         schema:
 *           type: string
 *           enum: ["Sch_Id", "Sch_No", "Sch_Date", "Task_Name", "Sch_Status", "Entry_Date"]
 *           default: "Sch_Id"
 *       - name: sortOrder
 *         in: query
 *         description: Sort order
 *         required: false
 *         schema:
 *           type: string
 *           enum: ["ASC", "DESC"]
 *           default: "DESC"
 *     responses:
 *       200:
 *         description: Successfully retrieved project schedules
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Project schedules retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProjectSchedule'
 *                 pagination:
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
router.get('/', getAllSchedules);

/**
 * @swagger
 * /api/masters/projectSchedule/dropdown:
 *   get:
 *     summary: Get project schedules for dropdown
 *     description: Retrieve active project schedules in dropdown format (value, label)
 *     tags: [Project Schedule]
 *     responses:
 *       200:
 *         description: Successfully retrieved project schedules for dropdown
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Project schedules for dropdown retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: integer
 *                         example: 1
 *                       label:
 *                         type: string
 *                         example: "SCH-2024-001 - Website Development"
 *       500:
 *         description: Internal server error
 */
router.get('/dropdown', getScheduleDropdown);

/**
 * @swagger
 * /api/masters/projectSchedule/plans/dropdown:
 *   get:
 *     summary: Get schedule plans for dropdown
 *     description: Retrieve schedule plan types in dropdown format
 *     tags: [Project Schedule]
 *     responses:
 *       200:
 *         description: Successfully retrieved schedule plans for dropdown
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Schedule plans for dropdown retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: integer
 *                         example: 1
 *                       label:
 *                         type: string
 *                         example: "Time Based"
 *       500:
 *         description: Internal server error
 */
router.get('/plans/dropdown', getSchedulePlansDropdown);

/**
 * @swagger
 * /api/masters/projectSchedule/tasks/dropdown:
 *   get:
 *     summary: Get tasks for dropdown
 *     description: Retrieve tasks in dropdown format for schedule assignment
 *     tags: [Project Schedule]
 *     responses:
 *       200:
 *         description: Successfully retrieved tasks for dropdown
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Tasks for dropdown retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: integer
 *                         example: 1
 *                       label:
 *                         type: string
 *                         example: "Website Development"
 *       500:
 *         description: Internal server error
 */
router.get('/tasks/dropdown', getTasksDropdown);

/**
 * @swagger
 * /api/masters/projectSchedule/types/dropdown:
 *   get:
 *     summary: Get schedule types for dropdown
 *     description: Retrieve schedule types in dropdown format
 *     tags: [Project Schedule]
 *     responses:
 *       200:
 *         description: Successfully retrieved schedule types for dropdown
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Schedule types for dropdown retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: integer
 *                         example: 1
 *                       label:
 *                         type: string
 *                         example: "Regular"
 *       500:
 *         description: Internal server error
 */
router.get('/types/dropdown', getScheduleTypesDropdown);

/**
 * @swagger
 * /api/masters/projectSchedule/{id}:
 *   get:
 *     summary: Get Project Schedule by ID
 *     description: Retrieve a specific project schedule by its ID with all details
 *     tags: [Project Schedule]
 *     parameters:
 *       - $ref: '#/components/parameters/scheduleId'
 *     responses:
 *       200:
 *         description: Successfully retrieved project schedule
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Project schedule retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/CompleteSchedule'
 *       400:
 *         description: Invalid ID parameter
 *       404:
 *         description: Project schedule not found
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
 *                   example: "Project schedule not found"
 *       500:
 *         description: Internal server error
 */
router.get('/:id', getScheduleById);

/**
 * @swagger
 * /api/masters/projectSchedule/{id}/details:
 *   get:
 *     summary: Get schedule details by schedule ID
 *     description: Retrieve all task details for a specific schedule
 *     tags: [Project Schedule]
 *     parameters:
 *       - $ref: '#/components/parameters/scheduleId'
 *     responses:
 *       200:
 *         description: Successfully retrieved schedule details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Schedule details retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ScheduleDetail'
 *       400:
 *         description: Invalid ID parameter
 *       404:
 *         description: Schedule not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id/details', getScheduleDetails);

/**
 * @swagger
 * /api/masters/projectSchedule:
 *   post:
 *     summary: Create a new Project Schedule
 *     description: Create a new project schedule with all related details
 *     tags: [Project Schedule]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScheduleCreate'
 *     responses:
 *       201:
 *         description: Project Schedule created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Project schedule created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     Sch_Id:
 *                       type: integer
 *                       example: 1
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
 *         description: Conflict - Schedule number already exists
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
 *                   example: "Schedule number already exists"
 *       500:
 *         description: Internal server error
 */
router.post('/',
    authenticate,
    authorize([1, 2, 3]), 
    createSchedule
);

/**
 * @swagger
 * /api/masters/projectSchedule/{id}:
 *   put:
 *     summary: Update a Project Schedule
 *     description: Update an existing project schedule by ID
 *     tags: [Project Schedule]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/scheduleId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScheduleUpdate'
 *     responses:
 *       200:
 *         description: Project Schedule updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Project schedule updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/CompleteSchedule'
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
 *         description: Project Schedule not found
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
 *                   example: "Project schedule not found"
 *       409:
 *         description: Conflict - Schedule number already exists
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
 *                   example: "Schedule number already exists"
 *       500:
 *         description: Internal server error
 */
router.put('/:id',
    authenticate,
    authorize([1, 2]), 
    updateSchedule
);

/**
 * @swagger
 * /api/masters/projectSchedule/{id}/status:
 *   patch:
 *     summary: Update schedule status
 *     description: Update only the status of a project schedule
 *     tags: [Project Schedule]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/scheduleId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StatusUpdate'
 *     responses:
 *       200:
 *         description: Schedule status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Schedule status updated successfully"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Schedule not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id/status',
    authenticate,
    authorize([1, 2, 3]), 
    updateScheduleStatus
);

/**
 * @swagger
 * /api/masters/projectSchedule/{id}:
 *   delete:
 *     summary: Delete a Project Schedule (Soft Delete)
 *     description: Soft delete a project schedule by setting Sch_Del_Flag to true
 *     tags: [Project Schedule]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/scheduleId'
 *     responses:
 *       200:
 *         description: Project Schedule deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Project schedule deleted successfully"
 *       400:
 *         description: Invalid ID parameter
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Project schedule not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id',
    authenticate,
    authorize([1]), 
    deleteSchedule
);

export default router;