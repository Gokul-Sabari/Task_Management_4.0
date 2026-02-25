// import { Router } from 'express';
// import {
//   createTaskDetailsRaw,
// } from '../../controllers/masters/taskManagement/projectScheduleEmp.controller';

// const router = Router();

// /**
//  * @swagger
//  * /api/masters/projectScheduleEmp/create:
//  *   post:
//  *     summary: Create task details for multiple employees (one by one insertion)
//  *     tags: [TaskDetails]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - Project_Id
//  *               - Sch_Id
//  *               - Task_Id
//  *               - Emp_Ids
//  *             properties:
//  *               Project_Id:
//  *                 type: integer
//  *                 example: 100
//  *               Sch_Id:
//  *                 type: integer
//  *                 example: 5
//  *               Task_Id:
//  *                 type: integer
//  *                 example: 10
//  *               Emp_Ids:
//  *                 type: array
//  *                 items:
//  *                   type: integer
//  *                 example: [1, 2, 4]
//  *               AN_No:
//  *                 type: integer
//  *                 example: 12345
//  *               Task_Levl_Id:
//  *                 type: integer
//  *                 example: 1
//  *               Assigned_Emp_Id:
//  *                 type: integer
//  *                 example: 101
//  *               Task_Assign_dt:
//  *                 type: string
//  *                 format: date-time
//  *                 example: "2024-01-15T10:00:00Z"
//  *               Sch_Period:
//  *                 type: string
//  *                 example: "Morning"
//  *               Sch_Time:
//  *                 type: string
//  *                 format: date-time
//  *                 example: "2024-01-15T09:00:00Z"
//  *               EN_Time:
//  *                 type: string
//  *                 format: date-time
//  *                 example: "2024-01-15T17:00:00Z"
//  *               Ord_By:
//  *                 type: integer
//  *                 example: 1
//  *               Invovled_Stat:
//  *                 type: integer
//  *                 example: 1
//  *     responses:
//  *       201:
//  *         description: Task details created successfully
//  *       400:
//  *         description: Validation failed
//  *       409:
//  *         description: Duplicate assignments found
//  *       500:
//  *         description: Internal server error
//  */
// router.post('/create', createTaskDetailsRaw);



// export default router;.
























import { Router } from 'express';
import {
  createTaskDetailsRaw,
  getAllTaskDetails,
  getTaskDetailById,
  getTaskDetailsByProject,
  getTaskDetailsBySchedule,
  getTaskDetailsByTask,
  getTaskDetailsByEmployee,
  updateTaskDetail,
  deleteTaskDetail,
  getTaskDetailsWithFilters,
  getTaskDetailsStatistics
} from '../../controllers/masters/taskManagement/projectScheduleEmp.controller';

const router = Router();

/**
 * @swagger
 * /api/masters/projectScheduleEmp/create:
 *   post:
 *     summary: Create task details for multiple employees (one by one insertion)
 *     tags: [TaskDetails]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Project_Id
 *               - Sch_Id
 *               - Task_Id
 *               - Emp_Ids
 *             properties:
 *               Project_Id:
 *                 type: integer
 *                 example: 100
 *               Sch_Id:
 *                 type: integer
 *                 example: 5
 *               Task_Id:
 *                 type: integer
 *                 example: 10
 *               Emp_Ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 4]
 *               AN_No:
 *                 type: integer
 *                 example: 12345
 *               Task_Levl_Id:
 *                 type: integer
 *                 example: 1
 *               Assigned_Emp_Id:
 *                 type: integer
 *                 example: 101
 *               Task_Assign_dt:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-15T10:00:00Z"
 *               Sch_Period:
 *                 type: string
 *                 example: "Morning"
 *               Sch_Time:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-15T09:00:00Z"
 *               EN_Time:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-15T17:00:00Z"
 *               Ord_By:
 *                 type: integer
 *                 example: 1
 *               Invovled_Stat:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Task details created successfully
 *       400:
 *         description: Validation failed
 *       409:
 *         description: Duplicate assignments found
 *       500:
 *         description: Internal server error
 */
router.post('/create', createTaskDetailsRaw);

/**
 * @swagger
 * /api/masters/projectScheduleEmp/list:
 *   get:
 *     summary: Get all task details with pagination and filtering
 *     tags: [TaskDetails]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: Project_Id
 *         schema:
 *           type: integer
 *         description: Filter by project ID
 *       - in: query
 *         name: Sch_Id
 *         schema:
 *           type: integer
 *         description: Filter by schedule ID
 *       - in: query
 *         name: Task_Id
 *         schema:
 *           type: integer
 *         description: Filter by task ID
 *       - in: query
 *         name: Emp_Id
 *         schema:
 *           type: integer
 *         description: Filter by employee ID
 *       - in: query
 *         name: Assigned_Emp_Id
 *         schema:
 *           type: integer
 *         description: Filter by assigned employee ID
 *       - in: query
 *         name: from_Task_Assign_dt
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for task assignment
 *       - in: query
 *         name: to_Task_Assign_dt
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for task assignment
 *       - in: query
 *         name: Invovled_Stat
 *         schema:
 *           type: integer
 *         description: Filter by involvement status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [Id, AN_No, Project_Id, Sch_Id, Task_Id, Emp_Id, Task_Assign_dt, Sch_Time, EN_Time, Invovled_Stat]
 *           default: Id
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Task details retrieved successfully
 *       400:
 *         description: Validation failed
 *       500:
 *         description: Internal server error
 */
router.get('/list', getAllTaskDetails);

/**
 * @swagger
 * /api/masters/projectScheduleEmp/filter:
 *   get:
 *     summary: Get task details with advanced filters
 *     tags: [TaskDetails]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: Project_Ids
 *         schema:
 *           type: string
 *         description: Comma-separated project IDs (e.g., 1,2,3)
 *       - in: query
 *         name: Task_Ids
 *         schema:
 *           type: string
 *         description: Comma-separated task IDs
 *       - in: query
 *         name: Emp_Ids
 *         schema:
 *           type: string
 *         description: Comma-separated employee IDs
 *       - in: query
 *         name: has_AN_No
 *         schema:
 *           type: boolean
 *         description: Filter records with/without AN_No
 *       - in: query
 *         name: has_Assigned_Emp
 *         schema:
 *           type: boolean
 *         description: Filter records with/without assigned employee
 *     responses:
 *       200:
 *         description: Task details retrieved successfully
 *       400:
 *         description: Validation failed
 *       500:
 *         description: Internal server error
 */
router.get('/filter', getTaskDetailsWithFilters);

/**
 * @swagger
 * /api/masters/projectScheduleEmp/{id}:
 *   get:
 *     summary: Get task detail by ID
 *     tags: [TaskDetails]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task detail ID
 *     responses:
 *       200:
 *         description: Task detail retrieved successfully
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Task detail not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', getTaskDetailById);

/**
 * @swagger
 * /api/masters/projectScheduleEmp/project/{projectId}:
 *   get:
 *     summary: Get task details by project ID
 *     tags: [TaskDetails]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Task details retrieved successfully
 *       400:
 *         description: Invalid project ID
 *       500:
 *         description: Internal server error
 */
router.get('/project/:projectId', getTaskDetailsByProject);

/**
 * @swagger
 * /api/masters/projectScheduleEmp/schedule/{schId}:
 *   get:
 *     summary: Get task details by schedule ID
 *     tags: [TaskDetails]
 *     parameters:
 *       - in: path
 *         name: schId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Schedule ID
 *     responses:
 *       200:
 *         description: Task details retrieved successfully
 *       400:
 *         description: Invalid schedule ID
 *       500:
 *         description: Internal server error
 */
router.get('/schedule/:schId', getTaskDetailsBySchedule);

/**
 * @swagger
 * /api/masters/projectScheduleEmp/task/{taskId}:
 *   get:
 *     summary: Get task details by task ID
 *     tags: [TaskDetails]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task details retrieved successfully
 *       400:
 *         description: Invalid task ID
 *       500:
 *         description: Internal server error
 */
router.get('/task/:taskId', getTaskDetailsByTask);

/**
 * @swagger
 * /api/masters/projectScheduleEmp/employee/{empId}:
 *   get:
 *     summary: Get task details by employee ID
 *     tags: [TaskDetails]
 *     parameters:
 *       - in: path
 *         name: empId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Task details retrieved successfully
 *       400:
 *         description: Invalid employee ID
 *       500:
 *         description: Internal server error
 */
router.get('/employee/:empId', getTaskDetailsByEmployee);

/**
 * @swagger
 * /api/masters/projectScheduleEmp/statistics:
 *   get:
 *     summary: Get task details statistics
 *     tags: [TaskDetails]
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/statistics/all', getTaskDetailsStatistics);

/**
 * @swagger
 * /api/masters/projectScheduleEmp/{id}:
 *   put:
 *     summary: Update task detail
 *     tags: [TaskDetails]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task detail ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               AN_No:
 *                 type: integer
 *               Project_Id:
 *                 type: integer
 *               Sch_Id:
 *                 type: integer
 *               Task_Levl_Id:
 *                 type: integer
 *               Task_Id:
 *                 type: integer
 *               Assigned_Emp_Id:
 *                 type: integer
 *               Emp_Id:
 *                 type: integer
 *               Task_Assign_dt:
 *                 type: string
 *                 format: date-time
 *               Sch_Period:
 *                 type: string
 *               Sch_Time:
 *                 type: string
 *                 format: date-time
 *               EN_Time:
 *                 type: string
 *                 format: date-time
 *               Ord_By:
 *                 type: integer
 *               Invovled_Stat:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Task detail updated successfully
 *       400:
 *         description: Validation failed
 *       404:
 *         description: Task detail not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', updateTaskDetail);

/**
 * @swagger
 * /api/masters/projectScheduleEmp/{id}:
 *   delete:
 *     summary: Delete task detail
 *     tags: [TaskDetails]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task detail ID
 *     responses:
 *       200:
 *         description: Task detail deleted successfully
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Task detail not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', deleteTaskDetail);

export default router;