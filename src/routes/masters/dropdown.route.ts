import express from 'express';
import {
    getProjectHeadDropdown,
    getProjectStatusDropdown,
    getEmployeeDropdown,
    getTaskDropdown,
    getAllDropdowns,
    searchEmployees,
    getCompany,
    // Sales person imports
    getSalesPersonsDropdown,
    getActiveSalesPersonsDropdown,
    searchSalesPersons,
    getSalesPersonsByBranchDropdown
} from '../../controllers/dropdown/dropdown.controller';
import { authenticate } from '../../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Dropdowns
 *   description: Dropdown data management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     DropdownItem:
 *       type: object
 *       properties:
 *         value:
 *           type: integer
 *           description: The value to be used as option value
 *           example: 1
 *         label:
 *           type: string
 *           description: The label to be displayed
 *           example: ""
 * 
 *     ProjectHeadDropdown:
 *       allOf:
 *         - $ref: '#/components/schemas/DropdownItem'
 *         - type: object
 *           properties:
 *             value:
 *               description: User ID from tbl_Users
 * 
 *     EmployeeDropdown:
 *       allOf:
 *         - $ref: '#/components/schemas/DropdownItem'
 *         - type: object
 *           properties:
 *             value:
 *               description: User ID from tbl_Users
 * 
 *     TaskDropdown:
 *       allOf:
 *         - $ref: '#/components/schemas/DropdownItem'
 *         - type: object
 *           properties:
 *             value:
 *               description: Task ID from tbl_Task
 * 
 *     SalesPersonDropdown:
 *       allOf:
 *         - $ref: '#/components/schemas/DropdownItem'
 *         - type: object
 *           properties:
 *             value:
 *               type: integer
 *               description: User ID from tbl_Users (userType = 6)
 *               example: 5
 *             label:
 *               type: string
 *               description: Sales person name
 *               example: "John Doe"
 *             uniqueName:
 *               type: string
 *               description: Unique username
 *               example: "john.doe"
 *             branchId:
 *               type: integer
 *               description: Branch ID
 *               example: 1
 *             branchName:
 *               type: string
 *               description: Branch name
 *               example: "Main Branch"
 *             isActive:
 *               type: integer
 *               enum: [0, 1]
 *               description: Active status
 *               example: 1
 * 
 *     ProjectStatusDropdown:
 *       allOf:
 *         - $ref: '#/components/schemas/DropdownItem'
 *         - type: object
 *           properties:
 *             value:
 *               type: integer
 *               enum: [0, 1]
 *               description: 0=Inactive, 1=Active
 *               example: 1
 *             label:
 *               type: string
 *               enum: ["Active", "Inactive"]
 *               example: "Active"
 * 
 *     CompanyDropdown:
 *       allOf:
 *         - $ref: '#/components/schemas/DropdownItem'
 *         - type: object
 *           properties:
 *             value:
 *               type: integer
 *               description: Company ID from tbl_Company_Master
 *               example: 1
 *             label:
 *               type: string
 *               description: Company name
 *               example: "ABC Corporation"
 * 
 *     AllDropdownsResponse:
 *       type: object
 *       properties:
 *         projectHeads:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProjectHeadDropdown'
 *         projectStatus:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProjectStatusDropdown'
 *         employees:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/EmployeeDropdown'
 *         tasks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TaskDropdown'
 *         salesPersons:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SalesPersonDropdown'
 * 
 *     DropdownResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Data retrieved successfully"
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DropdownItem'
 *         count:
 *           type: integer
 *           example: 25
 *         timestamp:
 *           type: string
 *           format: date-time
 * 
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Failed to retrieve data"
 *         error:
 *           type: string
 *           example: "Database connection error"
 *         timestamp:
 *           type: string
 *           format: date-time
 * 
 *   parameters:
 *     activeOnlyParam:
 *       name: activeOnly
 *       in: query
 *       description: Filter only active records
 *       required: false
 *       schema:
 *         type: boolean
 *         default: true
 *       example: true
 * 
 *     searchParam:
 *       name: search
 *       in: query
 *       description: Search term for employee names
 *       required: false
 *       schema:
 *         type: string
 *         minLength: 2
 *       example: ""
 * 
 *     branchIdPathParam:
 *       name: branchId
 *       in: path
 *       description: Branch ID
 *       required: true
 *       schema:
 *         type: integer
 *       example: 1
 * 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/masters/dropdowns/projectheads:
 *   get:
 *     summary: Get project heads dropdown
 *     description: Retrieve project heads from project_master table joined with tbl_Users
 *     tags: [Dropdowns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/activeOnlyParam'
 *     responses:
 *       200:
 *         description: Successfully retrieved project heads
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DropdownResponse'
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - No token provided
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/projectheads', authenticate, getProjectHeadDropdown);

/**
 * @swagger
 * /api/masters/dropdowns/projectStatus:
 *   get:
 *     summary: Get project status dropdown
 *     description: Retrieve project status options (Active/Inactive)
 *     tags: [Dropdowns]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved project status options
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DropdownResponse'
 *       401:
 *         description: Unauthorized - No token provided
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/projectStatus', authenticate, getProjectStatusDropdown);

/**
 * @swagger
 * /api/masters/dropdowns/employees:
 *   get:
 *     summary: Get employees dropdown
 *     description: Retrieve employees from tbl_Users table
 *     tags: [Dropdowns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/activeOnlyParam'
 *     responses:
 *       200:
 *         description: Successfully retrieved employees
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DropdownResponse'
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - No token provided
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/employees', authenticate, getEmployeeDropdown);

/**
 * @swagger
 * /api/masters/dropdowns/employees/search:
 *   get:
 *     summary: Search employees
 *     description: Search employees by name with typeahead functionality
 *     tags: [Dropdowns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/searchParam'
 *       - $ref: '#/components/parameters/activeOnlyParam'
 *     responses:
 *       200:
 *         description: Successfully searched employees
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DropdownResponse'
 *       400:
 *         description: Missing or invalid search parameter
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
 *                   example: "Search term is required"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - No token provided
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/employees/search', authenticate, searchEmployees);

/**
 * @swagger
 * /api/masters/dropdowns/tasks:
 *   get:
 *     summary: Get tasks dropdown
 *     description: Retrieve tasks from tbl_Task table
 *     tags: [Dropdowns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/activeOnlyParam'
 *     responses:
 *       200:
 *         description: Successfully retrieved tasks
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DropdownResponse'
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - No token provided
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/tasks', authenticate, getTaskDropdown);

/**
 * @swagger
 * /api/masters/dropdowns/all:
 *   get:
 *     summary: Get all dropdowns combined
 *     description: Retrieve all dropdowns in a single API call
 *     tags: [Dropdowns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/activeOnlyParam'
 *     responses:
 *       200:
 *         description: Successfully retrieved all dropdowns
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
 *                   example: "All dropdowns retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/AllDropdownsResponse'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - No token provided
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/all', authenticate, getAllDropdowns);

/**
 * @swagger
 * /api/masters/dropdowns/company:
 *   get:
 *     summary: Get company dropdown
 *     description: Retrieve companies from Company_Master table
 *     tags: [Dropdowns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/activeOnlyParam'
 *     responses:
 *       200:
 *         description: Successfully retrieved companies
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DropdownResponse'
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - No token provided
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/company', authenticate, getCompany);

// ==================== SALES PERSONS ROUTES ====================

/**
 * @swagger
 * /api/masters/dropdowns/sales-persons:
 *   get:
 *     summary: Get sales persons dropdown
 *     description: Retrieve sales persons (users with userType = 6) from tbl_Users table
 *     tags: [Dropdowns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/activeOnlyParam'
 *       - name: search
 *         in: query
 *         description: Search term for sales person names
 *         required: false
 *         schema:
 *           type: string
 *         example: "john"
 *     responses:
 *       200:
 *         description: Successfully retrieved sales persons
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DropdownResponse'
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - No token provided
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/sales-persons', authenticate, getSalesPersonsDropdown);

/**
 * @swagger
 * /api/masters/dropdowns/sales-persons/active:
 *   get:
 *     summary: Get active sales persons dropdown
 *     description: Retrieve active sales persons (users with userType = 6 and isActive = 1)
 *     tags: [Dropdowns]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved active sales persons
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DropdownResponse'
 *       401:
 *         description: Unauthorized - No token provided
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/sales-persons/active', authenticate, getActiveSalesPersonsDropdown);

/**
 * @swagger
 * /api/masters/dropdowns/sales-persons/search:
 *   get:
 *     summary: Search sales persons
 *     description: Search sales persons by name with typeahead functionality
 *     tags: [Dropdowns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/searchParam'
 *       - $ref: '#/components/parameters/activeOnlyParam'
 *     responses:
 *       200:
 *         description: Successfully searched sales persons
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DropdownResponse'
 *       400:
 *         description: Missing or invalid search parameter
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
 *                   example: "Search term is required"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - No token provided
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/sales-persons/search', authenticate, searchSalesPersons);

/**
 * @swagger
 * /api/masters/dropdowns/sales-persons/branch/{branchId}:
 *   get:
 *     summary: Get sales persons by branch
 *     description: Retrieve sales persons filtered by branch ID
 *     tags: [Dropdowns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/branchIdPathParam'
 *       - $ref: '#/components/parameters/activeOnlyParam'
 *     responses:
 *       200:
 *         description: Successfully retrieved sales persons by branch
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DropdownResponse'
 *       400:
 *         description: Missing branch ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - No token provided
 *       404:
 *         description: Branch not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/sales-persons/branch/:branchId', authenticate, getSalesPersonsByBranchDropdown);

export default router;