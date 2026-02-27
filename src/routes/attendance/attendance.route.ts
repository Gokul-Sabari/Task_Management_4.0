import express from 'express';
import attendanceController from '../../controllers/Attendace/attendance.controller'; // Renamed import
import { authenticate } from '../../middleware/auth';

const router = express.Router();

// attendanceController is already the object - NO need to call it as a function
const {
    addAttendance,
    getMyLastAttendance,
    closeAttendance,
    getAttendanceHistory,
    getDepartment,
    employeewise,
    getEmployeesByDepartment
} = attendanceController;

/**
 * @swagger
 * tags:
 *   name: Attendance
 *   description: Employee attendance management endpoints
 */

/**
 * @swagger
 * components:
 *   parameters:
 *     fromDateQuery:
 *       name: From
 *       in: query
 *       description: Start date for attendance history (YYYY-MM-DD)
 *       required: true
 *       schema:
 *         type: string
 *         format: date
 *       example: "2024-01-01"
 *     toDateQuery:
 *       name: To
 *       in: query
 *       description: End date for attendance history (YYYY-MM-DD)
 *       required: true
 *       schema:
 *         type: string
 *         format: date
 *       example: "2024-12-31"
 *     userIdQuery:
 *       name: UserId
 *       in: query
 *       description: Filter by user ID (optional)
 *       required: false
 *       schema:
 *         type: integer
 *       example: 123
 *     userTypeIdQuery:
 *       name: UserTypeID
 *       in: query
 *       description: User type ID (6 for salesperson, 3 for other types)
 *       required: true
 *       schema:
 *         type: integer
 *       example: 6
 *     branchIdQuery:
 *       name: Branch_Id
 *       in: query
 *       description: Filter by branch ID (optional)
 *       required: false
 *       schema:
 *         type: integer
 *       example: 10
 *   
 *   schemas:
 *     Attendance:
 *       type: object
 *       properties:
 *         Id:
 *           type: integer
 *         UserId:
 *           type: integer
 *         UserTypeID:
 *           type: integer
 *         Start_Date:
 *           type: string
 *           format: date-time
 *         End_Date:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         Latitude:
 *           type: number
 *           format: float
 *         Longitude:
 *           type: number
 *           format: float
 *         Active_Status:
 *           type: integer
 *           enum: [0, 1]
 *         Work_Summary:
 *           type: string
 *           nullable: true
 *         User_Name:
 *           type: string
 *         Branch_Id:
 *           type: integer
 *         startKmImageUrl:
 *           type: string
 *           nullable: true
 *         endKmImageUrl:
 *           type: string
 *           nullable: true
 */
// ==================== ATTENDANCE ENDPOINTS ====================

/**
 * @swagger
 * /api/attendance/my/last:
 *   get:
 *     summary: Get current user's last attendance
 *     description: Retrieve the most recent attendance record for the authenticated user
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdQuery'
 *     responses:
 *       200:
 *         description: Successfully retrieved last attendance
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
 *                   $ref: '#/components/schemas/Attendance'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No attendance record found
 *       500:
 *         description: Internal server error
 */
router.get('/my/last', authenticate, getMyLastAttendance);

/**
 * @swagger
 * /api/attendance/history:
 *   get:
 *     summary: Get attendance history by date range
 *     description: Retrieve attendance records within a specified date range
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/fromDateQuery'
 *       - $ref: '#/components/parameters/toDateQuery'
 *       - $ref: '#/components/parameters/userIdQuery'
 *       - $ref: '#/components/parameters/userTypeIdQuery'  # Add this reference
 *       - $ref: '#/components/parameters/branchIdQuery'    # Add this reference
 *     responses:
 *       200:
 *         description: Successfully retrieved attendance history
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
 *                     $ref: '#/components/schemas/Attendance'
 *       400:
 *         description: Invalid date parameters
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No records found
 *       500:
 *         description: Internal server error
 */
router.get('/history', authenticate, getAttendanceHistory);

/**
 * @swagger
 * /api/attendance:
 *   post:
 *     summary: Check-in / Add attendance
 *     description: Create a new attendance record (check-in)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - UserId
 *               - Latitude
 *               - Longitude
 *             properties:
 *               UserId:
 *                 type: integer
 *                 example: 101
 *               Start_KM:
 *                 type: number
 *                 example: 12500
 *               Latitude:
 *                 type: number
 *                 format: float
 *                 example: 40.7128
 *               Longitude:
 *                 type: number
 *                 format: float
 *                 example: -74.0060
 *               Start_KM_Pic:
 *                 type: string
 *                 format: binary
 *                 description: Start kilometer photo (optional)
 *     responses:
 *       201:
 *         description: Check-in successful
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
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Conflict - User already has active attendance
 *       500:
 *         description: Internal server error
 */
router.post('/', authenticate, addAttendance);

/**
 * @swagger
 * /api/attendance/{id}/close:
 *   put:
 *     summary: Check-out / Close attendance
 *     description: Close an active attendance record (check-out)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/attendanceId'
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               End_KM:
 *                 type: number
 *                 example: 12750
 *               Description:
 *                 type: string
 *                 example: "Completed project tasks"
 *               End_KM_Pic:
 *                 type: string
 *                 format: binary
 *                 description: End kilometer photo (optional)
 *     responses:
 *       200:
 *         description: Check-out successful
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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Active attendance record not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/close', authenticate, closeAttendance);

/**
 * @swagger
 * /api/attendance/department/list:
 *   get:
 *     summary: Get all departments
 *     description: Retrieve list of all departments
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved departments
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
 *                     department:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: string
 *                           label:
 *                             type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/department/list', authenticate, getDepartment);

/**
 * @swagger
 * /api/attendance/employee-wise:
 *   get:
 *     summary: Get employee wise attendance statistics
 *     description: Retrieve detailed attendance statistics by department and employee
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/fromDateQuery'
 *       - $ref: '#/components/parameters/toDateQuery'
 *     responses:
 *       200:
 *         description: Successfully retrieved employee wise statistics
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
 *       400:
 *         description: Invalid date parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/employee-wise', authenticate, employeewise);

/**
 * @swagger
 * /api/attendance/employees-by-department:
 *   post:
 *     summary: Get employees by department
 *     description: Retrieve list of employees belonging to a specific department
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - department
 *             properties:
 *               department:
 *                 type: string
 *                 example: "IT"
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
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     employees:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           label:
 *                             type: string
 *                           value:
 *                             type: integer
 *       400:
 *         description: Department is required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/employees-by-department', authenticate, getEmployeesByDepartment);

export default router;