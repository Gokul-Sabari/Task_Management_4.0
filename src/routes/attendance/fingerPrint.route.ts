import { Router } from 'express';
import { 
    getFingerprintAttendance,
    getEmployeeAttendanceSummary,
    getTodayAttendance,
    getEmployeeAttendance,
    getDeviceAttendance,
    getAttendanceByDateRange,
    getMonthlyAttendance,
    getAbsentEmployees,
    getPresentEmployees,
    getAttendanceStats
} from '../../controllers/Attendace/fingerPrintAttendance.controller'; // Make sure the file extension is correct
// import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Fingerprint Attendance
 *   description: Fingerprint attendance management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AttendanceResult:
 *       type: object
 *       properties:
 *         fingerPrintEmpId:
 *           type: string
 *           example: "EMP001"
 *         Designation_Name:
 *           type: string
 *           example: "Software Engineer"
 *         username:
 *           type: string
 *           example: "John Doe"
 *         LogDate:
 *           type: string
 *           format: date
 *           example: "2024-01-15"
 *         AttendanceDetails:
 *           type: string
 *           example: "09:00, 13:00, 14:00, 18:00"
 *         TotalRecords:
 *           type: integer
 *           example: 4
 *         AttendanceStatus:
 *           type: string
 *           enum: [P, A, L, H, DL]
 *           example: "P"
 *     
 *     AttendanceSummary:
 *       type: object
 *       properties:
 *         employeeId:
 *           type: string
 *           example: "25"
 *         month:
 *           type: integer
 *           example: 1
 *         year:
 *           type: integer
 *           example: 2024
 *         totalDays:
 *           type: integer
 *           example: 22
 *         presentDays:
 *           type: integer
 *           example: 20
 *         absentDays:
 *           type: integer
 *           example: 1
 *         leaveDays:
 *           type: integer
 *           example: 1
 *         holidayDays:
 *           type: integer
 *           example: 0
 *         defaultLeaveDays:
 *           type: integer
 *           example: 0
 *         attendancePercentage:
 *           type: number
 *           example: 90.91
 * 
 *     AttendanceStats:
 *       type: object
 *       properties:
 *         totalEmployees:
 *           type: integer
 *           example: 50
 *         totalPresent:
 *           type: integer
 *           example: 45
 *         totalAbsent:
 *           type: integer
 *           example: 3
 *         totalLeave:
 *           type: integer
 *           example: 2
 *         attendanceRate:
 *           type: number
 *           example: 90.0
 * 
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Error message"
 *         data:
 *           type: array
 *           example: []
 * 
 *     Success:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Data found"
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AttendanceResult'
 * 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/attendance/fingerprint:
 *   get:
 *     summary: Get fingerprint attendance records
 *     tags: [Fingerprint Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: FromDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: ToDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *         example: "2024-01-31"
 *       - in: query
 *         name: FingerPrintId
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by fingerprint device ID
 *         example: "EMP001"
 *       - in: query
 *         name: EmpId
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by employee ID
 *         example: "25"
 *     responses:
 *       200:
 *         description: Successfully retrieved attendance records
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid input parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', getFingerprintAttendance);

/**
 * @swagger
 * /api/attendance/fingerprint/today:
 *   get:
 *     summary: Get today's attendance for all employees
 *     tags: [Fingerprint Attendance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved today's attendance
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/today', getTodayAttendance);

/**
 * @swagger
 * /api/attendance/fingerprint/summary:
 *   get:
 *     summary: Get attendance summary for an employee
 *     tags: [Fingerprint Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: EmpId
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *         example: "25"
 *       - in: query
 *         name: month
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Month number (1-12, defaults to current)
 *         example: 1
 *       - in: query
 *         name: year
 *         required: false
 *         schema:
 *           type: integer
 *         description: Year (defaults to current)
 *         example: 2024
 *     responses:
 *       200:
 *         description: Successfully retrieved attendance summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AttendanceSummary'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/summary', getEmployeeAttendanceSummary);

/**
 * @swagger
 * /api/attendance/fingerprint/employee/{empId}:
 *   get:
 *     summary: Get attendance for specific employee
 *     tags: [Fingerprint Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: empId
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *         example: "25"
 *       - in: query
 *         name: FromDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: ToDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *         example: "2024-01-31"
 *     responses:
 *       200:
 *         description: Successfully retrieved employee attendance
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No records found
 *       500:
 *         description: Server error
 */
router.get('/employee/:empId', getEmployeeAttendance);

/**
 * @swagger
 * /api/attendance/fingerprint/device/{deviceId}:
 *   get:
 *     summary: Get attendance for specific fingerprint device
 *     tags: [Fingerprint Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Fingerprint Device ID
 *         example: "EMP001"
 *       - in: query
 *         name: FromDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: ToDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *         example: "2024-01-31"
 *     responses:
 *       200:
 *         description: Successfully retrieved device attendance
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/device/:deviceId', getDeviceAttendance);

/**
 * @swagger
 * /api/attendance/fingerprint/date-range:
 *   get:
 *     summary: Get attendance for custom date range
 *     tags: [Fingerprint Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *         example: "2024-01-31"
 *       - in: query
 *         name: EmpId
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by employee ID
 *         example: "25"
 *       - in: query
 *         name: FingerPrintId
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by fingerprint device ID
 *         example: "EMP001"
 *     responses:
 *       200:
 *         description: Successfully retrieved attendance records
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/date-range', getAttendanceByDateRange);

/**
 * @swagger
 * /api/attendance/fingerprint/month/{year}/{month}:
 *   get:
 *     summary: Get attendance for specific month
 *     tags: [Fingerprint Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Year
 *         example: 2024
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Month number (1-12)
 *         example: 1
 *       - in: query
 *         name: EmpId
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by employee ID
 *         example: "25"
 *       - in: query
 *         name: FingerPrintId
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by fingerprint device ID
 *         example: "EMP001"
 *     responses:
 *       200:
 *         description: Successfully retrieved monthly attendance
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/month/:year/:month', getMonthlyAttendance);

/**
 * @swagger
 * /api/attendance/fingerprint/absent:
 *   get:
 *     summary: Get absent employees for a date range
 *     tags: [Fingerprint Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: FromDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: ToDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *         example: "2024-01-31"
 *     responses:
 *       200:
 *         description: Successfully retrieved absent employees
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/absent',  getAbsentEmployees);

/**
 * @swagger
 * /api/attendance/fingerprint/present:
 *   get:
 *     summary: Get present employees for a date range
 *     tags: [Fingerprint Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: FromDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: ToDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *         example: "2024-01-31"
 *     responses:
 *       200:
 *         description: Successfully retrieved present employees
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/present', getPresentEmployees);

/**
 * @swagger
 * /api/attendance/fingerprint/stats:
 *   get:
 *     summary: Get attendance statistics
 *     tags: [Fingerprint Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: FromDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: ToDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *         example: "2024-01-31"
 *     responses:
 *       200:
 *         description: Successfully retrieved attendance statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AttendanceStats'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/stats', getAttendanceStats);

export default router;