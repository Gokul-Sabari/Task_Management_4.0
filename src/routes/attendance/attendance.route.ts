import { Router } from 'express';
import attendanceController from '../../controllers/Attendace/attendance.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Attendance
 *   description: Attendance management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Attendance:
 *       type: object
 *       properties:
 *         Id:
 *           type: integer
 *           description: Auto-generated ID
 *           example: 1
 *         UserId:
 *           type: integer
 *           description: User ID
 *           example: 25
 *         Start_Date:
 *           type: string
 *           format: date-time
 *           description: Attendance start date and time
 *           example: "2024-05-22T04:15:52.727Z"
 *         End_Date:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Attendance end date and time
 *           example: null
 *         IsSalesPerson:
 *           type: integer
 *           enum: [0, 1]
 *           description: Is the user a sales person
 *           example: 1
 *         Start_KM:
 *           type: number
 *           nullable: true
 *           description: Starting kilometer reading
 *           example: 2862
 *         End_KM:
 *           type: number
 *           nullable: true
 *           description: Ending kilometer reading
 *           example: null
 *         Latitude:
 *           type: number
 *           nullable: true
 *           description: Latitude coordinate
 *           example: null
 *         Longitude:
 *           type: number
 *           nullable: true
 *           description: Longitude coordinate
 *           example: null
 *         Start_KM_ImageName:
 *           type: string
 *           nullable: true
 *           description: Start kilometer image filename
 *           example: "2024-05-22T04-15-51.757Z_photo.jpg"
 *         End_KM_ImageName:
 *           type: string
 *           nullable: true
 *           description: End kilometer image filename
 *           example: null
 *         WorkSummary:
 *           type: string
 *           nullable: true
 *           description: Work summary/description
 *           example: null
 *         Active_Status:
 *           type: integer
 *           enum: [0, 1]
 *           description: Active status (1 = active, 0 = closed)
 *           example: 1
 *     
 *     AttendanceResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: integer
 *           example: 200
 *         message:
 *           type: string
 *           example: Data found successfully
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Attendance'
 *     
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: integer
 *           example: 400
 *         message:
 *           type: string
 *           example: Invalid input parameters
 *     
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: integer
 *           example: 200
 *         message:
 *           type: string
 *           example: Attendance Noted!
 */

/**
 * @swagger
 * /api/attendance/add:
 *   post:
 *     summary: Add new attendance record
 *     tags: [Attendance]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - UserId
 *             properties:
 *               UserId:
 *                 type: number
 *                 description: User ID
 *                 example: 25
 *               Start_KM:
 *                 type: number
 *                 description: Starting kilometer reading
 *                 example: 2862
 *               Latitude:
 *                 type: number
 *                 description: Latitude coordinate
 *                 example: 40.7128
 *               Longitude:
 *                 type: number
 *                 description: Longitude coordinate
 *                 example: -74.0060
 *               Start_KM_Pic:
 *                 type: string
 *                 format: binary
 *                 description: Start kilometer photo
 *     responses:
 *       200:
 *         description: Attendance added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 */
router.post('/add', attendanceController.addAttendance);

/**
 * @swagger
 * /api/attendance/last:
 *   get:
 *     summary: Get user's last attendance
 *     tags: [Attendance]
 *     parameters:
 *       - in: query
 *         name: UserId
 *         required: true
 *         schema:
 *           type: number
 *         description: User ID
 *         example: 25
 *     responses:
 *       200:
 *         description: Last attendance record found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AttendanceResponse'
 *       404:
 *         description: No attendance record found
 *       400:
 *         description: Invalid UserId
 */
router.get('/last', attendanceController.getMyLastAttendance);

/**
 * @swagger
 * /api/attendance/close:
 *   put:
 *     summary: Close an attendance record
 *     tags: [Attendance]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - Id
 *             properties:
 *               Id:
 *                 type: number
 *                 description: Attendance ID to close
 *                 example: 1
 *               End_KM:
 *                 type: number
 *                 description: Ending kilometer reading
 *                 example: 2900
 *               Description:
 *                 type: string
 *                 description: Work summary
 *                 example: "Completed daily tasks"
 *               End_KM_Pic:
 *                 type: string
 *                 format: binary
 *                 description: End kilometer photo
 *     responses:
 *       200:
 *         description: Attendance closed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Attendance record not found
 */
router.put('/close', attendanceController.closeAttendance);

/**
 * @swagger
 * /api/attendance/history:
 *   get:
 *     summary: Get attendance history
 *     tags: [Attendance]
 *     parameters:
 *       - in: query
 *         name: UserId
 *         schema:
 *           type: number
 *         description: Filter by User ID (optional)
 *         example: 25
 *       - in: query
 *         name: UserTypeID
 *         required: true
 *         schema:
 *           type: number
 *         description: User type ID (3=Manager, 6=Sales Person)
 *         example: 6
 *       - in: query
 *         name: Branch_Id
 *         schema:
 *           type: number
 *         description: Filter by branch ID (optional)
 *         example: 1
 *       - in: query
 *         name: From
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: To
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *         example: "2024-12-31"
 *     responses:
 *       200:
 *         description: Attendance history found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AttendanceResponse'
 *       404:
 *         description: No attendance records found
 */
router.get('/history', attendanceController.getAttendanceHistory);

/**
 * @swagger
 * /api/attendance/history-sequelize:
 *   get:
 *     summary: Get attendance history using Sequelize
 *     tags: [Attendance]
 *     parameters:
 *       - in: query
 *         name: UserId
 *         schema:
 *           type: number
 *         description: Filter by User ID (optional)
 *         example: 25
 *       - in: query
 *         name: UserTypeID
 *         schema:
 *           type: number
 *         description: User type ID (optional)
 *         example: 6
 *       - in: query
 *         name: From
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: To
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *         example: "2024-12-31"
 *     responses:
 *       200:
 *         description: Attendance history found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AttendanceResponse'
 *       404:
 *         description: No attendance records found
 */
router.get('/history-sequelize', attendanceController.getAttendanceHistorySequelize);

/**
 * @swagger
 * /api/attendance/departments:
 *   get:
 *     summary: Get all departments
 *     tags: [Attendance]
 *     responses:
 *       200:
 *         description: List of departments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Data found successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: string
 *                         example: "IT"
 *                       label:
 *                         type: string
 *                         example: "IT"
 */
router.get('/departments', attendanceController.getDepartment);

/**
 * @swagger
 * /api/attendance/employees-by-department:
 *   post:
 *     summary: Get employees by department
 *     tags: [Attendance]
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
 *                 description: Department name
 *                 example: "IT"
 *     responses:
 *       200:
 *         description: List of employees in the department
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Data found successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       label:
 *                         type: string
 *                         example: "John Doe"
 *                       value:
 *                         type: integer
 *                         example: 1
 *       400:
 *         description: Department is required
 */
router.post('/employees-by-department', attendanceController.getEmployeesByDepartment);

/**
 * @swagger
 * /api/attendance/stats:
 *   get:
 *     summary: Get attendance statistics
 *     tags: [Attendance]
 *     parameters:
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *         example: "2024-12-31"
 *       - in: query
 *         name: userId
 *         schema:
 *           type: number
 *         description: Filter by user ID (optional)
 *         example: 25
 *     responses:
 *       200:
 *         description: Attendance statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Data found successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       totalAttendance:
 *                         type: integer
 *                         example: 150
 *                       uniqueUsers:
 *                         type: integer
 *                         example: 25
 *                       activeSessions:
 *                         type: integer
 *                         example: 5
 *                       completedSessions:
 *                         type: integer
 *                         example: 145
 *                       salesPersonAttendance:
 *                         type: integer
 *                         example: 80
 */
router.get('/stats', attendanceController.getAttendanceStats);

/**
 * @swagger
 * /api/attendance/user-summary:
 *   get:
 *     summary: Get user's attendance summary
 *     tags: [Attendance]
 *     parameters:
 *       - in: query
 *         name: UserId
 *         required: true
 *         schema:
 *           type: number
 *         description: User ID
 *         example: 25
 *       - in: query
 *         name: year
 *         schema:
 *           type: number
 *         description: Year (optional, defaults to current year)
 *         example: 2024
 *       - in: query
 *         name: month
 *         schema:
 *           type: number
 *         description: Month (optional, 1-12, defaults to current month)
 *         example: 5
 *     responses:
 *       200:
 *         description: User attendance summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Data found successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       totalDays:
 *                         type: integer
 *                         example: 22
 *                       presentDays:
 *                         type: integer
 *                         example: 20
 *                       activeDays:
 *                         type: integer
 *                         example: 2
 *                       totalWorkHours:
 *                         type: number
 *                         example: 176.5
 */
router.get('/user-summary', attendanceController.getUserAttendanceSummary);

export default router;