import express from 'express';
import {
    getAllTaskAssign,
    getTaskAssignById,
    createTaskAssign,
    updateTaskAssign,
    deleteTaskAssign,
    createBulkTaskAssign,
    updateBulkTaskAssign,
    deleteBulkTaskAssign
} from '../../controllers/masters/taskManagement/taskAssign.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: TaskAssign
 *   description: Project-Employee Assignment Management
 */

/**
 * @swagger
 * /api/masters/projectAssign:
 *   get:
 *     summary: Get all project-employee assignments
 *     description: Retrieve paginated list of assignments
 *     tags: [TaskAssign]
 *     parameters:
 *       - name: page
 *         in: query
 *         description: Page number
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         description: Items per page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 20
 *       - name: projectId
 *         in: query
 *         description: Filter by project ID
 *         required: false
 *         schema:
 *           type: integer
 *       - name: userId
 *         in: query
 *         description: Filter by user ID
 *         required: false
 *         schema:
 *           type: integer
 *       - name: sortBy
 *         in: query
 *         description: Field to sort by
 *         required: false
 *         schema:
 *           type: string
 *           default: Id
 *       - name: sortOrder
 *         in: query
 *         description: Sort order (ASC/DESC)
 *         required: false
 *         schema:
 *           type: string
 *           default: ASC
 *     responses:
 *       200:
 *         description: Successfully retrieved assignments
 *       500:
 *         description: Internal server error
 */
router.get('/', getAllTaskAssign);

/**
 * @swagger
 * /api/masters/projectAssign/{id}:
 *   get:
 *     summary: Get assignment by ID
 *     description: Retrieve a specific assignment by its ID
 *     tags: [TaskAssign]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Assignment ID
 *     responses:
 *       200:
 *         description: Successfully retrieved assignment
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Assignment not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', getTaskAssignById);

/**
 * @swagger
 * /api/masters/projectAssign/single:
 *   post:
 *     summary: Create a single assignment
 *     description: Assign an employee to a project (single assignment)
 *     tags: [TaskAssign]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Project_Id
 *               - User_Id
 *             properties:
 *               Project_Id:
 *                 type: integer
 *               User_Id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Assignment created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Employee already assigned to this project
 *       500:
 *         description: Internal server error
 */
router.post('/single',
    authenticate,
    authorize([1, 2]),
    createTaskAssign
);

/**
 * @swagger
 * /api/masters/projectAssign/bulk:
 *   post:
 *     summary: Create multiple assignments
 *     description: Assign multiple employees to projects in bulk
 *     tags: [TaskAssign]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               required:
 *                 - Project_Id
 *                 - User_Id
 *               properties:
 *                 Project_Id:
 *                   type: integer
 *                 User_Id:
 *                   type: integer
 *             example:
 *               - Project_Id: 1
 *                 User_Id: 101
 *               - Project_Id: 1
 *                 User_Id: 102
 *               - Project_Id: 2
 *                 User_Id: 103
 *     responses:
 *       201:
 *         description: Assignments created successfully
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
 *                     $ref: '#/components/schemas/TaskAssign'
 *                 skipped:
 *                   type: integer
 *                 skippedAssignments:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Validation error
 *       409:
 *         description: Some or all assignments already exist
 *       500:
 *         description: Internal server error
 */
router.post('/bulk',
    authenticate,
    authorize([1, 2]),
    createBulkTaskAssign
);

/**
 * @swagger
 * /api/masters/projectAssign/{id}:
 *   put:
 *     summary: Update a single assignment
 *     description: Update an existing assignment
 *     tags: [TaskAssign]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Assignment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Project_Id:
 *                 type: integer
 *               User_Id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Assignment updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Assignment not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id',
    authenticate,
    authorize([1, 2]),
    updateTaskAssign
);

/**
 * @swagger
 * /api/masters/projectAssign/bulk:
 *   put:
 *     summary: Update project assignments in bulk
 *     description: >
 *       Deletes all existing user assignments for each Project_Id
 *       and inserts the provided User_Id entries as fresh assignments.
 *       Each Project_Id can appear multiple times, each with a User_Id.
 *     tags: [TaskAssign]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               required:
 *                 - Project_Id
 *                 - User_Id
 *               properties:
 *                 Project_Id:
 *                   type: integer
 *                   example: 1
 *                 User_Id:
 *                   type: integer
 *                   example: 12
 *           example:
 *             - Project_Id: 1
 *               User_Id: 12
 *             - Project_Id: 1
 *               User_Id: 11
 *             - Project_Id: 1
 *               User_Id: 23
 *     responses:
 *       200:
 *         description: Assignments updated successfully
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
 *                   example: Project assignments updated successfully
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalProjects:
 *                       type: integer
 *                     totalDeleted:
 *                       type: integer
 *                     totalCreated:
 *                       type: integer
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       Project_Id:
 *                         type: integer
 *                       deletedCount:
 *                         type: integer
 *                       createdCount:
 *                         type: integer
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.put(
  '/bulk',
  authenticate,
  authorize([1, 2]),
  updateBulkTaskAssign
);


/**
 * @swagger
 * /api/masters/projectAssign/bulk:
 *   delete:
 *     summary: Delete multiple assignments
 *     description: Delete multiple assignments in bulk
 *     tags: [TaskAssign]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of assignment IDs to delete
 *             example:
 *               ids: [1, 2, 3]
 *     responses:
 *       200:
 *         description: Assignments deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 deletedCount:
 *                   type: integer
 *                 notFoundIds:
 *                   type: array
 *                   items:
 *                     type: integer
 *       400:
 *         description: Validation error
 *       404:
 *         description: No assignments found
 *       500:
 *         description: Internal server error
 */
router.delete('/bulk',
    authenticate,
    authorize([1]),
    deleteBulkTaskAssign
);

/**
 * @swagger
 * /api/masters/projectAssign/{id}:
 *   delete:
 *     summary: Delete a single assignment
 *     description: Delete a project-employee assignment
 *     tags: [TaskAssign]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Assignment ID
 *     responses:
 *       200:
 *         description: Assignment deleted successfully
 *       404:
 *         description: Assignment not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id',
    authenticate,
    authorize([1]),
    deleteTaskAssign
);

/**
 * @swagger
 * components:
 *   schemas:
 *     TaskAssign:
 *       type: object
 *       properties:
 *         Id:
 *           type: integer
 *         Project_Id:
 *           type: integer
 *         User_Id:
 *           type: integer
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

export default router;