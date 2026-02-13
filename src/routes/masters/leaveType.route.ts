import express from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { 
    createLeaveType, 
    deleteLeaveType, 
    getAllLeaveTypes, 
    getLeaveTypeById, 
    getLeaveTypeDropdown, 
    updateLeaveType 
} from '../../controllers/masters/taskManagement/leaveType.controller';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Leave Type
 *   description: Leave Type management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     LeaveType:
 *       type: object
 *       properties:
 *         Id:
 *           type: integer
 *           readOnly: true
 *           example: 1
 *         LeaveType:
 *           type: string
 *           maxLength: 100
 *           example: "Annual Leave"
 * 
 *     LeaveTypeCreate:
 *       type: object
 *       required:
 *         - LeaveType
 *       properties:
 *         LeaveType:
 *           type: string
 *           maxLength: 100
 *           example: "Annual Leave"
 * 
 *     LeaveTypeUpdate:
 *       type: object
 *       required:
 *         - LeaveType
 *       properties:
 *         LeaveType:
 *           type: string
 *           maxLength: 100
 *           example: "Updated Leave Type"
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
 *                 example: "LeaveType"
 *               message:
 *                 type: string
 *                 example: "Leave type is required"
 * 
 *   parameters:
 *     leaveTypeId:
 *       name: id
 *       in: path
 *       description: Leave Type ID
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
 *       description: Search by leave type name
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

/**
 * @swagger
 * /api/masters/leaveType:
 *   get:
 *     summary: Get all leave types with pagination and filtering
 *     description: Retrieve a paginated list of leave types with optional search
 *     tags: [Leave Type]
 *     parameters:
 *       - $ref: '#/components/parameters/paginationPage'
 *       - $ref: '#/components/parameters/paginationLimit'
 *       - $ref: '#/components/parameters/searchQuery'
 *       - name: sortBy
 *         in: query
 *         description: Sort field
 *         required: false
 *         schema:
 *           type: string
 *           enum: ["Id", "LeaveType"]
 *           default: "Id"
 *       - name: sortOrder
 *         in: query
 *         description: Sort order
 *         required: false
 *         schema:
 *           type: string
 *           enum: ["ASC", "DESC"]
 *           default: "ASC"
 *     responses:
 *       200:
 *         description: Successfully retrieved leave types
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
 *                   example: "Leave types retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LeaveType'
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
router.get('/', getAllLeaveTypes);

/**
 * @swagger
 * /api/masters/leaveType/dropdown:
 *   get:
 *     summary: Get leave types for dropdown
 *     description: Retrieve leave types in dropdown format (value, label)
 *     tags: [Leave Type]
 *     responses:
 *       200:
 *         description: Successfully retrieved leave types for dropdown
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
 *                   example: "Leave types for dropdown retrieved successfully"
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
 *                         example: "Annual Leave"
 *       500:
 *         description: Internal server error
 */
router.get('/dropdown', getLeaveTypeDropdown);

/**
 * @swagger
 * /api/masters/leaveType/{id}:
 *   get:
 *     summary: Get Leave Type by ID
 *     description: Retrieve a specific Leave Type by its ID
 *     tags: [Leave Type]
 *     parameters:
 *       - $ref: '#/components/parameters/leaveTypeId'
 *     responses:
 *       200:
 *         description: Successfully retrieved leave type
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
 *                   example: "Leave type retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/LeaveType'
 *       400:
 *         description: Invalid ID parameter
 *       404:
 *         description: Leave type not found
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
 *                   example: "Leave type not found"
 *       500:
 *         description: Internal server error
 */
router.get('/:id', getLeaveTypeById);

/**
 * @swagger
 * /api/masters/leaveType:
 *   post:
 *     summary: Create a new Leave Type
 *     description: Create a new Leave Type record
 *     tags: [Leave Type]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LeaveTypeCreate'      
 *     responses:
 *       201:
 *         description: Leave Type created successfully
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
 *                   example: "Leave type created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/LeaveType'
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
 *         description: Conflict - Leave Type already exists
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
 *                   example: "Leave type already exists"
 *       500:
 *         description: Internal server error
 */
router.post('/',
    authenticate,
    authorize([1, 2]),
    createLeaveType
);

/**
 * @swagger
 * /api/masters/leaveType/{id}:
 *   put:
 *     summary: Update a Leave Type
 *     description: Update an existing Leave Type by ID
 *     tags: [Leave Type]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/leaveTypeId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LeaveTypeUpdate'
 *     responses:
 *       200:
 *         description: Leave Type updated successfully
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
 *                   example: "Leave type updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/LeaveType'
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
 *         description: Leave Type not found
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
 *                   example: "Leave type not found"
 *       409:
 *         description: Conflict - Leave Type name already exists
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
 *                   example: "Leave type name already exists"
 *       500:
 *         description: Internal server error
 */
router.put('/:id',
    authenticate,
    authorize([1, 2]),
    updateLeaveType
);

/**
 * @swagger
 * /api/masters/leaveType/{id}:
 *   delete:
 *     summary: Delete a Leave Type
 *     description: Delete a Leave Type permanently
 *     tags: [Leave Type]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/leaveTypeId'
 *     responses:
 *       200:
 *         description: Leave Type deleted successfully
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
 *                   example: "Leave type deleted successfully"
 *       400:
 *         description: Invalid ID parameter
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Leave type not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id',
    authenticate,
    authorize([1]),
    deleteLeaveType
);

export default router;