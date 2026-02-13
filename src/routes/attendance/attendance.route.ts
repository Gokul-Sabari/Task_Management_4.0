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
 *   schemas:
 *     Attendance:
 *       type: object
 *       required:
 *         - UserId
 *         - Latitude
 *         - Longitude
 *       properties:
 *         Id:
 *           type: integer
 *           readOnly: true
 *           example: 1
 *         UserId:
 *           type: integer
 *           minimum: 1
 *           example: 101
 *         Start_Date:
 *           type: string
 *           format: date-time
 *           readOnly: true
 *           example: "2024-01-15T09:00:00.000Z"
 *         End_Date:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2024-01-15T17:00:00.000Z"
 *         Latitude:
 *           type: number
 *           format: float
 *           minimum: -90
 *           maximum: 90
 *           example: 40.7128
 *         Longitude:
 *           type: number
 *           format: float
 *           minimum: -180
 *           maximum: 180
 *           example: -74.0060
 *         Active_Status:
 *           type: integer
 *           minimum: 0
 *           maximum: 1
 *           default: 1
 *           example: 1
 *         Work_Summary:
 *           type: string
 *           maxLength: 500
 *           nullable: true
 *           example: "Completed daily tasks and client meeting"
 *         Start_KM:
 *           type: number
 *           nullable: true
 *           example: 12500
 *         End_KM:
 *           type: number
 *           nullable: true
 *           example: 12750
 *         Start_KM_ImageName:
 *           type: string
 *           nullable: true
 *           example: "start_km_12345.jpg"
 *         End_KM_ImageName:
 *           type: string
 *           nullable: true
 *           example: "end_km_12345.jpg"
 *         IsSalesPerson:
 *           type: integer
 *           minimum: 0
 *           maximum: 1
 *           example: 0
 *
 *     AttendanceCreate:
 *       type: object
 *       required:
 *         - UserId
 *         - Latitude
 *         - Longitude
 *       properties:
 *         UserId:
 *           type: integer
 *           minimum: 1
 *           example: 101
 *         Start_KM:
 *           type: number
 *           example: 12500
 *         Latitude:
 *           type: number
 *           format: float
 *           minimum: -90
 *           maximum: 90
 *           example: 40.7128
 *         Longitude:
 *           type: number
 *           format: float
 *           minimum: -180
 *           maximum: 180
 *           example: -74.0060
 *
 *     AttendanceClose:
 *       type: object
 *       properties:
 *         End_KM:
 *           type: number
 *           example: 12750
 *         Description:
 *           type: string
 *           maxLength: 500
 *           nullable: true
 *           example: "Completed project tasks"
 *
 *   parameters:
 *     attendanceId:
 *       name: id
 *       in: path
 *       description: Attendance Record ID
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *       example: 1
 *
 *     userIdQuery:
 *       name: userId
 *       in: query
 *       description: Filter by user ID
 *       required: false
 *       schema:
 *         type: integer
 *         minimum: 1
 *
 *     fromDateQuery:
 *       name: from
 *       in: query
 *       description: Start date for filtering
 *       required: false
 *       schema:
 *         type: string
 *         format: date
 *         example: "2024-01-01"
 *
 *     toDateQuery:
 *       name: to
 *       in: query
 *       description: End date for filtering
 *       required: false
 *       schema:
 *         type: string
 *         format: date
 *         example: "2024-01-31"
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
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