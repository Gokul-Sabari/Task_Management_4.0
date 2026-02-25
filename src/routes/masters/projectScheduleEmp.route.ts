import { Router } from 'express';
import {
  createTaskDetailsRaw,
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



export default router;