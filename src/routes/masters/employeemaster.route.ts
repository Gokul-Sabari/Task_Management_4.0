import express from 'express';
import {
    getAllEmployees,
    getEmployeeById,
    getEmployeeByCode,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeesByBranch,
    getEmployeesByDepartment,
    getActiveEmployees,
    bulkCreateEmployees,
    getEmployeeStatistics,
    partialUpdateEmployee,
    searchEmployees,
    getEmployeeCount,
    getEmployeesBySalaryRange,
} from '../../controllers/masters/taskManagement/employeemaster.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: EmployeeMaster
 *   description: Employee Master management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Employee:
 *       type: object
 *       required:
 *         - Emp_Code
 *         - Emp_Name
 *       properties:
 *         Emp_Id:
 *           type: integer
 *           readOnly: true
 *           example: 1
 *         Branch:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         fingerPrintEmpId:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           example: "FP12345"
 *         Emp_Code:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           example: "EMP001"
 *         Emp_Name:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *           example: "John Doe"
 *         Designation:
 *           type: integer
 *           nullable: true
 *           example: 2
 *         DOB:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: "1990-01-01"
 *         DOJ:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: "2020-01-01"
 *         Department_ID:
 *           type: integer
 *           nullable: true
 *           example: 3
 *         Address_1:
 *           type: string
 *           maxLength: 500
 *           nullable: true
 *           example: "123 Main Street"
 *         Address_2:
 *           type: string
 *           maxLength: 500
 *           nullable: true
 *           example: "Apt 4B"
 *         City:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           example: "New York"
 *         Country:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           example: "USA"
 *         Pincode:
 *           type: string
 *           maxLength: 20
 *           nullable: true
 *           example: "10001"
 *         Mobile_No:
 *           type: string
 *           maxLength: 20
 *           nullable: true
 *           example: "+1234567890"
 *         Education:
 *           type: string
 *           maxLength: 255
 *           nullable: true
 *           example: "Bachelor's Degree"
 *         Fathers_Name:
 *           type: string
 *           maxLength: 255
 *           nullable: true
 *           example: "James Doe"
 *         Mothers_Name:
 *           type: string
 *           maxLength: 255
 *           nullable: true
 *           example: "Jane Doe"
 *         Spouse_Name:
 *           type: string
 *           maxLength: 255
 *           nullable: true
 *           example: "Sarah Doe"
 *         Sex:
 *           type: string
 *           enum: ['Male', 'Female', 'Other']
 *           nullable: true
 *           example: "Male"
 *         Emp_Religion:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           example: "Christian"
 *         Salary:
 *           type: number
 *           format: decimal
 *           minimum: 0
 *           nullable: true
 *           example: 50000.00
 *         Total_Loan:
 *           type: number
 *           format: decimal
 *           minimum: 0
 *           default: 0
 *           nullable: true
 *           example: 10000.00
 *         Salary_Advance:
 *           type: number
 *           format: decimal
 *           minimum: 0
 *           default: 0
 *           nullable: true
 *           example: 5000.00
 *         Due_Loan:
 *           type: number
 *           format: decimal
 *           minimum: 0
 *           default: 0
 *           nullable: true
 *           example: 5000.00
 *         User_Mgt_Id:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         Entry_By:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         Entry_Date:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2024-01-01T10:00:00.000Z"
 *         Department:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           example: "IT Department"
 *         Location:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           example: "Head Office"
 * 
 *     EmployeeCreate:
 *       type: object
 *       required:
 *         - Emp_Code
 *         - Emp_Name
 *       properties:
 *         Branch:
 *           type: integer
 *           minimum: 1
 *           nullable: true
 *           optional: true
 *         fingerPrintEmpId:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           optional: true
 *         Emp_Code:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           example: "EMP001"
 *         Emp_Name:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *           example: "John Doe"
 *         Designation:
 *           type: integer
 *           minimum: 1
 *           nullable: true
 *           optional: true
 *         DOB:
 *           type: string
 *           format: date
 *           nullable: true
 *           optional: true
 *         DOJ:
 *           type: string
 *           format: date
 *           nullable: true
 *           optional: true
 *         Department_ID:
 *           type: integer
 *           minimum: 1
 *           nullable: true
 *           optional: true
 *         Address_1:
 *           type: string
 *           maxLength: 500
 *           nullable: true
 *           optional: true
 *         Address_2:
 *           type: string
 *           maxLength: 500
 *           nullable: true
 *           optional: true
 *         City:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           optional: true
 *         Country:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           optional: true
 *         Pincode:
 *           type: string
 *           maxLength: 20
 *           pattern: '^\d+$'
 *           nullable: true
 *           optional: true
 *         Mobile_No:
 *           type: string
 *           maxLength: 20
 *           nullable: true
 *           optional: true
 *         Education:
 *           type: string
 *           maxLength: 255
 *           nullable: true
 *           optional: true
 *         Fathers_Name:
 *           type: string
 *           maxLength: 255
 *           nullable: true
 *           optional: true
 *         Mothers_Name:
 *           type: string
 *           maxLength: 255
 *           nullable: true
 *           optional: true
 *         Spouse_Name:
 *           type: string
 *           maxLength: 255
 *           nullable: true
 *           optional: true
 *         Sex:
 *           type: string
 *           enum: ['Male', 'Female', 'Other']
 *           nullable: true
 *           optional: true
 *         Emp_Religion:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           optional: true
 *         Salary:
 *           type: number
 *           format: decimal
 *           minimum: 0
 *           nullable: true
 *           optional: true
 *         Total_Loan:
 *           type: number
 *           format: decimal
 *           minimum: 0
 *           default: 0
 *           nullable: true
 *           optional: true
 *         Salary_Advance:
 *           type: number
 *           format: decimal
 *           minimum: 0
 *           default: 0
 *           nullable: true
 *           optional: true
 *         Due_Loan:
 *           type: number
 *           format: decimal
 *           minimum: 0
 *           default: 0
 *           nullable: true
 *           optional: true
 *         User_Mgt_Id:
 *           type: integer
 *           minimum: 1
 *           nullable: true
 *           optional: true
 *         Entry_By:
 *           type: integer
 *           minimum: 1
 *           nullable: true
 *           optional: true
 *         Department:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           optional: true
 *         Location:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           optional: true
 * 
 *     EmployeeUpdate:
 *       type: object
 *       properties:
 *         Branch:
 *           type: integer
 *           minimum: 1
 *           nullable: true
 *           optional: true
 *         fingerPrintEmpId:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           optional: true
 *         Emp_Code:
 *           type: string
 *           maxLength: 50
 *           optional: true
 *         Emp_Name:
 *           type: string
 *           maxLength: 255
 *           optional: true
 *         Designation:
 *           type: integer
 *           minimum: 1
 *           nullable: true
 *           optional: true
 *         DOB:
 *           type: string
 *           format: date
 *           nullable: true
 *           optional: true
 *         DOJ:
 *           type: string
 *           format: date
 *           nullable: true
 *           optional: true
 *         Department_ID:
 *           type: integer
 *           minimum: 1
 *           nullable: true
 *           optional: true
 *         Address_1:
 *           type: string
 *           maxLength: 500
 *           nullable: true
 *           optional: true
 *         Address_2:
 *           type: string
 *           maxLength: 500
 *           nullable: true
 *           optional: true
 *         City:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           optional: true
 *         Country:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           optional: true
 *         Pincode:
 *           type: string
 *           maxLength: 20
 *           pattern: '^\d+$'
 *           nullable: true
 *           optional: true
 *         Mobile_No:
 *           type: string
 *           maxLength: 20
 *           nullable: true
 *           optional: true
 *         Education:
 *           type: string
 *           maxLength: 255
 *           nullable: true
 *           optional: true
 *         Fathers_Name:
 *           type: string
 *           maxLength: 255
 *           nullable: true
 *           optional: true
 *         Mothers_Name:
 *           type: string
 *           maxLength: 255
 *           nullable: true
 *           optional: true
 *         Spouse_Name:
 *           type: string
 *           maxLength: 255
 *           nullable: true
 *           optional: true
 *         Sex:
 *           type: string
 *           enum: ['Male', 'Female', 'Other']
 *           nullable: true
 *           optional: true
 *         Emp_Religion:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           optional: true
 *         Salary:
 *           type: number
 *           format: decimal
 *           minimum: 0
 *           nullable: true
 *           optional: true
 *         Total_Loan:
 *           type: number
 *           format: decimal
 *           minimum: 0
 *           nullable: true
 *           optional: true
 *         Salary_Advance:
 *           type: number
 *           format: decimal
 *           minimum: 0
 *           nullable: true
 *           optional: true
 *         Due_Loan:
 *           type: number
 *           format: decimal
 *           minimum: 0
 *           nullable: true
 *           optional: true
 *         User_Mgt_Id:
 *           type: integer
 *           minimum: 1
 *           nullable: true
 *           optional: true
 *         Entry_By:
 *           type: integer
 *           minimum: 1
 *           nullable: true
 *           optional: true
 *         Department:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           optional: true
 *         Location:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           optional: true
 * 
 *     EmployeeBulkCreate:
 *       type: array
 *       items:
 *         $ref: '#/components/schemas/EmployeeCreate'
 * 
 *     EmployeeStatistics:
 *       type: object
 *       properties:
 *         totalEmployees:
 *           type: integer
 *           example: 100
 *         genderDistribution:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               Sex:
 *                 type: string
 *                 example: "Male"
 *               count:
 *                 type: integer
 *                 example: 60
 *         departmentDistribution:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               Department_ID:
 *                 type: integer
 *                 example: 1
 *               Department:
 *                 type: string
 *                 example: "IT"
 *               count:
 *                 type: integer
 *                 example: 20
 *         salaryStatistics:
 *           type: object
 *           properties:
 *             averageSalary:
 *               type: number
 *               format: decimal
 *               example: 45000.50
 *             maxSalary:
 *               type: number
 *               format: decimal
 *               example: 100000.00
 *             minSalary:
 *               type: number
 *               format: decimal
 *               example: 25000.00
 *             totalSalary:
 *               type: number
 *               format: decimal
 *               example: 4500050.00
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
 *                 example: "Emp_Code"
 *               message:
 *                 type: string
 *                 example: "Employee Code is required"
 * 
 *     Pagination:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           example: 100
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 50
 *         totalPages:
 *           type: integer
 *           example: 2
 * 
 *   parameters:
 *     employeeId:
 *       name: id
 *       in: path
 *       description: Employee ID
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *       example: 1
 * 
 *     empCode:
 *       name: empCode
 *       in: path
 *       description: Employee Code
 *       required: true
 *       schema:
 *         type: string
 *         minLength: 1
 *         maxLength: 50
 *       example: "EMP001"
 * 
 *     branchId:
 *       name: branchId
 *       in: path
 *       description: Branch ID
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *       example: 1
 * 
 *     departmentId:
 *       name: departmentId
 *       in: path
 *       description: Department ID
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *       example: 1
 * 
 *     branchQuery:
 *       name: branch
 *       in: query
 *       description: Filter by branch ID
 *       required: false
 *       schema:
 *         type: integer
 *         minimum: 1
 * 
 *     departmentIdQuery:
 *       name: departmentId
 *       in: query
 *       description: Filter by department ID
 *       required: false
 *       schema:
 *         type: integer
 *         minimum: 1
 * 
 *     designationQuery:
 *       name: designation
 *       in: query
 *       description: Filter by designation ID
 *       required: false
 *       schema:
 *         type: integer
 *         minimum: 1
 * 
 *     searchQuery:
 *       name: search
 *       in: query
 *       description: Search term for employee code, name, or mobile number
 *       required: false
 *       schema:
 *         type: string
 *         maxLength: 100
 * 
 *     sortByQuery:
 *       name: sortBy
 *       in: query
 *       description: Field to sort by
 *       required: false
 *       schema:
 *         type: string
 *         enum: ['Emp_Id', 'Emp_Code', 'Emp_Name', 'DOJ', 'Department_ID', 'Salary']
 *         default: 'Emp_Id'
 * 
 *     sortOrderQuery:
 *       name: sortOrder
 *       in: query
 *       description: Sort order
 *       required: false
 *       schema:
 *         type: string
 *         enum: ['ASC', 'DESC']
 *         default: 'ASC'
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
 *         default: 50
 * 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// ============================================
// PUBLIC ENDPOINTS (No authentication required)
// ============================================

/**
 * @swagger
 * /api/masters/employees:
 *   get:
 *     summary: Get all employees with filtering and pagination
 *     description: Retrieve all employees with optional filtering, sorting, and pagination
 *     tags: [EmployeeMaster]
 *     parameters:
 *       - $ref: '#/components/parameters/branchQuery'
 *       - $ref: '#/components/parameters/departmentIdQuery'
 *       - $ref: '#/components/parameters/designationQuery'
 *       - $ref: '#/components/parameters/searchQuery'
 *       - $ref: '#/components/parameters/sortByQuery'
 *       - $ref: '#/components/parameters/sortOrderQuery'
 *       - $ref: '#/components/parameters/pageQuery'
 *       - $ref: '#/components/parameters/limitQuery'
 *     responses:
 *       200:
 *         description: Successfully retrieved employees
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
 *                   example: "Employees fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Employee'
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
router.get('/', getAllEmployees);

/**
 * @swagger
 * /api/masters/employees/active:
 *   get:
 *     summary: Get all active employees
 *     description: Retrieve all active employees sorted by name
 *     tags: [EmployeeMaster]
 *     responses:
 *       200:
 *         description: Successfully retrieved active employees
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
 *                     $ref: '#/components/schemas/Employee'
 *       500:
 *         description: Internal server error
 */
router.get('/active', getActiveEmployees);

/**
 * @swagger
 * /api/masters/employees/statistics:
 *   get:
 *     summary: Get employee statistics
 *     description: Retrieve statistics about employees including counts by gender, department, and salary statistics
 *     tags: [EmployeeMaster]
 *     responses:
 *       200:
 *         description: Successfully retrieved employee statistics
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
 *                   $ref: '#/components/schemas/EmployeeStatistics'
 *       500:
 *         description: Internal server error
 */
router.get('/statistics', getEmployeeStatistics);

/**
 * @swagger
 * /api/masters/employees/search:
 *   get:
 *     summary: Search employees with advanced filtering
 *     description: Search employees using multiple filter criteria
 *     tags: [EmployeeMaster]
 *     parameters:
 *       - name: name
 *         in: query
 *         description: Search by employee name
 *         required: false
 *         schema:
 *           type: string
 *       - name: department
 *         in: query
 *         description: Filter by department ID
 *         required: false
 *         schema:
 *           type: integer
 *       - name: designation
 *         in: query
 *         description: Filter by designation ID
 *         required: false
 *         schema:
 *           type: integer
 *       - name: branch
 *         in: query
 *         description: Filter by branch ID
 *         required: false
 *         schema:
 *           type: integer
 *       - name: city
 *         in: query
 *         description: Filter by city
 *         required: false
 *         schema:
 *           type: string
 *       - name: fromDate
 *         in: query
 *         description: Filter by date of joining from date (YYYY-MM-DD)
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - name: toDate
 *         in: query
 *         description: Filter by date of joining to date (YYYY-MM-DD)
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - name: minSalary
 *         in: query
 *         description: Filter by minimum salary
 *         required: false
 *         schema:
 *           type: number
 *           format: decimal
 *       - name: maxSalary
 *         in: query
 *         description: Filter by maximum salary
 *         required: false
 *         schema:
 *           type: number
 *           format: decimal
 *     responses:
 *       200:
 *         description: Successfully searched employees
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
 *                     $ref: '#/components/schemas/Employee'
 *                 count:
 *                   type: integer
 *       400:
 *         description: Invalid search parameters
 *       500:
 *         description: Internal server error
 */
router.get('/search', searchEmployees);

/**
 * @swagger
 * /api/masters/employees/count:
 *   get:
 *     summary: Get employee count by criteria
 *     description: Get the count of employees based on filter criteria
 *     tags: [EmployeeMaster]
 *     parameters:
 *       - name: branch
 *         in: query
 *         description: Filter by branch ID
 *         required: false
 *         schema:
 *           type: integer
 *       - name: departmentId
 *         in: query
 *         description: Filter by department ID
 *         required: false
 *         schema:
 *           type: integer
 *       - name: designation
 *         in: query
 *         description: Filter by designation ID
 *         required: false
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successfully retrieved employee count
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
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *       500:
 *         description: Internal server error
 */
router.get('/count', getEmployeeCount);

/**
 * @swagger
 * /api/masters/employees/salary-range:
 *   get:
 *     summary: Get employees by salary range
 *     description: Retrieve employees filtered by salary range
 *     tags: [EmployeeMaster]
 *     parameters:
 *       - name: minSalary
 *         in: query
 *         description: Minimum salary
 *         required: false
 *         schema:
 *           type: number
 *           format: decimal
 *       - name: maxSalary
 *         in: query
 *         description: Maximum salary
 *         required: false
 *         schema:
 *           type: number
 *           format: decimal
 *     responses:
 *       200:
 *         description: Successfully retrieved employees by salary range
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
 *                     $ref: '#/components/schemas/Employee'
 *                 count:
 *                   type: integer
 *       400:
 *         description: Please provide at least one salary parameter
 *       500:
 *         description: Internal server error
 */
router.get('/salary-range', getEmployeesBySalaryRange);

/**
 * @swagger
 * /api/masters/employees/branch/{branchId}:
 *   get:
 *     summary: Get employees by branch
 *     description: Retrieve all employees in a specific branch
 *     tags: [EmployeeMaster]
 *     parameters:
 *       - $ref: '#/components/parameters/branchId'
 *     responses:
 *       200:
 *         description: Successfully retrieved employees by branch
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
 *                     $ref: '#/components/schemas/Employee'
 *       400:
 *         description: Valid Branch ID is required
 *       404:
 *         description: No employees found in this branch
 *       500:
 *         description: Internal server error
 */
router.get('/branch/:branchId', getEmployeesByBranch);

/**
 * @swagger
 * /api/masters/employees/department/{departmentId}:
 *   get:
 *     summary: Get employees by department
 *     description: Retrieve all employees in a specific department
 *     tags: [EmployeeMaster]
 *     parameters:
 *       - $ref: '#/components/parameters/departmentId'
 *     responses:
 *       200:
 *         description: Successfully retrieved employees by department
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
 *                     $ref: '#/components/schemas/Employee'
 *       400:
 *         description: Valid Department ID is required
 *       404:
 *         description: No employees found in this department
 *       500:
 *         description: Internal server error
 */
router.get('/department/:departmentId', getEmployeesByDepartment);

/**
 * @swagger
 * /api/masters/employees/{id}:
 *   get:
 *     summary: Get employee by ID
 *     description: Retrieve a specific employee by their ID
 *     tags: [EmployeeMaster]
 *     parameters:
 *       - $ref: '#/components/parameters/employeeId'
 *     responses:
 *       200:
 *         description: Successfully retrieved employee
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
 *                   $ref: '#/components/schemas/Employee'
 *       400:
 *         description: Invalid ID parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', getEmployeeById);

/**
 * @swagger
 * /api/masters/employees/code/{empCode}:
 *   get:
 *     summary: Get employee by employee code
 *     description: Retrieve a specific employee by their employee code
 *     tags: [EmployeeMaster]
 *     parameters:
 *       - $ref: '#/components/parameters/empCode'
 *     responses:
 *       200:
 *         description: Successfully retrieved employee
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
 *                   $ref: '#/components/schemas/Employee'
 *       400:
 *         description: Employee Code is required
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */
router.get('/code/:empCode', getEmployeeByCode);

// ============================================
// PROTECTED ENDPOINTS (Authentication required)
// ============================================

/**
 * @swagger
 * /api/masters/employees:
 *   post:
 *     summary: Create a new employee
 *     description: Create a new employee record
 *     tags: [EmployeeMaster]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmployeeCreate'
 *     responses:
 *       201:
 *         description: Employee created successfully
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
 *                   $ref: '#/components/schemas/Employee'
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
 *         description: Conflict - Employee with this code already exists
 *       500:
 *         description: Internal server error
 */
router.post('/',
    authenticate,
    authorize([1, 2]), // Adjust role IDs as per your system
    createEmployee
);

/**
 * @swagger
 * /api/masters/employees/bulk:
 *   post:
 *     summary: Bulk create employees
 *     description: Create multiple employees in a single request
 *     tags: [EmployeeMaster]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmployeeBulkCreate'
 *     responses:
 *       201:
 *         description: Bulk employee creation completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 created:
 *                   type: integer
 *                   description: Number of employees successfully created
 *                 failed:
 *                   type: integer
 *                   description: Number of employees that failed to create
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       empCode:
 *                         type: string
 *                       success:
 *                         type: boolean
 *                       employeeId:
 *                         type: integer
 *                       message:
 *                         type: string
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       empCode:
 *                         type: string
 *                       message:
 *                         type: string
 *                       errors:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             field:
 *                               type: string
 *                             message:
 *                               type: string
 *       400:
 *         description: Request body must be an array of employee data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post('/bulk',
    authenticate,
    authorize([1, 2]), // Adjust role IDs as per your system
    bulkCreateEmployees
);

/**
 * @swagger
 * /api/masters/employees/{id}:
 *   put:
 *     summary: Update an employee
 *     description: Update an existing employee by ID
 *     tags: [EmployeeMaster]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/employeeId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmployeeUpdate'
 *     responses:
 *       200:
 *         description: Employee updated successfully
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
 *                   $ref: '#/components/schemas/Employee'
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
 *         description: Employee not found
 *       409:
 *         description: Conflict - Another employee with this code already exists
 *       500:
 *         description: Internal server error
 */
router.put('/:id',
    authenticate,
    authorize([1, 2]), // Adjust role IDs as per your system
    updateEmployee
);

/**
 * @swagger
 * /api/masters/employees/{id}:
 *   patch:
 *     summary: Partially update an employee
 *     description: Update specific fields of an existing employee by ID
 *     tags: [EmployeeMaster]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/employeeId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmployeeUpdate'
 *     responses:
 *       200:
 *         description: Employee partially updated successfully
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
 *                   $ref: '#/components/schemas/Employee'
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
 *         description: Employee not found
 *       409:
 *         description: Conflict - Another employee with this code already exists
 *       500:
 *         description: Internal server error
 */
router.patch('/:id',
    authenticate,
    authorize([1, 2]), // Adjust role IDs as per your system
    partialUpdateEmployee
);

/**
 * @swagger
 * /api/masters/employees/{id}:
 *   delete:
 *     summary: Delete an employee
 *     description: Permanently delete an employee by ID
 *     tags: [EmployeeMaster]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/employeeId'
 *     responses:
 *       200:
 *         description: Employee deleted successfully
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
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id',
    authenticate,
    authorize([1]), // Admin only - adjust as needed
    deleteEmployee
);

export default router;