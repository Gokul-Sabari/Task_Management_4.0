import { Request, Response } from 'express';
import sql from 'mssql';
import { dataFound, noData, invalidInput, servError } from '../../responseObject';
import { 
    AttendanceResult,
    AttendanceSummary
} from '../../models/Attendance/Fingerprint/fingerPrintAttendance.model';

const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};


const isValidDate = (dateStr: string): boolean => {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
};

export const getFingerprintAttendance = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { FromDate, ToDate, FingerPrintId, EmpId } = req.query;

      
        if (!FromDate || !ToDate) {
            return invalidInput(res, "FromDate and ToDate are required");
        }

       
        if (!isValidDate(FromDate as string) || !isValidDate(ToDate as string)) {
            return invalidInput(res, "Invalid date format. Use YYYY-MM-DD");
        }


        const toDateObj = new Date(ToDate as string);
        const adjustedToDate = new Date(toDateObj);
        adjustedToDate.setDate(adjustedToDate.getDate() + 1);
        const adjustedToDateStr = adjustedToDate.toISOString();

        let result: AttendanceResult[] = [];

   
        if (EmpId && EmpId !== "0" && EmpId !== "ALL") {
            result = await getSingleEmployeeAttendance(
                FromDate as string,
                adjustedToDateStr,
                EmpId as string
            );
        } 
     
        else {
            result = await getMultipleEmployeesAttendance(
                FromDate as string,
                adjustedToDateStr,
                FingerPrintId as string | undefined
            );
        }

      
        
        return result.length > 0 
            ? dataFound(res, result) 
            : noData(res);

    } catch (error) {
        console.error('Error in getFingerprintAttendance:', error);
        return servError(error, res);
    }
};

export const getTodayAttendance = async (req: Request, res: Response): Promise<Response> => {
    try {
        const today = formatDateToString(new Date());
        const tomorrow = formatDateToString(new Date(new Date().setDate(new Date().getDate() + 1)));

        const records = await getMultipleEmployeesAttendance(today, tomorrow);

        return dataFound(res, records);

    } catch (error) {
        console.error('Error in getTodayAttendance:', error);
        return servError(error, res);
    }
};

export const getEmployeeAttendanceSummary = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { EmpId, month, year } = req.query;

        if (!EmpId) {
            return invalidInput(res, "EmpId is required");
        }

        // Calculate date range
        const yearNum = year ? Number(year) : new Date().getFullYear();
        const monthNum = month ? Number(month) - 1 : new Date().getMonth();
        
        const startDate = new Date(yearNum, monthNum, 1);
        const endDate = new Date(yearNum, monthNum + 1, 0);

        // Format dates
        const fromDateStr = formatDateToString(startDate);
        const toDateStr = formatDateToString(endDate);

        // Get attendance records
        const records = await getSingleEmployeeAttendance(
            fromDateStr,
            new Date(endDate.setDate(endDate.getDate() + 1)).toISOString(),
            EmpId as string
        );

        // Calculate summary
        const summary: AttendanceSummary = {
            employeeId: EmpId as string,
            month: monthNum + 1,
            year: yearNum,
            totalDays: records.length,
            presentDays: records.filter(r => r.AttendanceStatus === 'P').length,
            absentDays: records.filter(r => r.AttendanceStatus === 'A').length,
            leaveDays: records.filter(r => r.AttendanceStatus === 'L').length,
            holidayDays: records.filter(r => r.AttendanceStatus === 'H').length,
            defaultLeaveDays: records.filter(r => r.AttendanceStatus === 'DL').length,
            attendancePercentage: records.length > 0 
                ? Number(((records.filter(r => r.AttendanceStatus === 'P').length / records.length) * 100).toFixed(2))
                : 0
        };

        return dataFound(res, [summary]);

    } catch (error) {
        console.error('Error in getEmployeeAttendanceSummary:', error);
        return servError(error, res);
    }
};

export const getEmployeeAttendance = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { empId } = req.params;
        const { FromDate, ToDate } = req.query;

        if (!FromDate || !ToDate) {
            return invalidInput(res, "FromDate and ToDate are required");
        }

        req.query.EmpId = empId;
        return getFingerprintAttendance(req, res);
    } catch (error) {
        console.error('Error in getEmployeeAttendance:', error);
        return servError(error, res);
    }
};

export const getDeviceAttendance = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { deviceId } = req.params;
        const { FromDate, ToDate } = req.query;

        if (!FromDate || !ToDate) {
            return invalidInput(res, "FromDate and ToDate are required");
        }

        req.query.FingerPrintId = deviceId;
        return getFingerprintAttendance(req, res);
    } catch (error) {
        console.error('Error in getDeviceAttendance:', error);
        return servError(error, res);
    }
};

export const getAttendanceByDateRange = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return invalidInput(res, "startDate and endDate are required");
        }

        req.query.FromDate = startDate as string;
        req.query.ToDate = endDate as string;
        
        return getFingerprintAttendance(req, res);
    } catch (error) {
        console.error('Error in getAttendanceByDateRange:', error);
        return servError(error, res);
    }
};

export const getMonthlyAttendance = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { year, month } = req.params;
        
        const startDate = new Date(Number(year), Number(month) - 1, 1);
        const endDate = new Date(Number(year), Number(month), 0);
        
        req.query.FromDate = formatDateToString(startDate);
        req.query.ToDate = formatDateToString(endDate);
        
        return getFingerprintAttendance(req, res);
    } catch (error) {
        console.error('Error in getMonthlyAttendance:', error);
        return servError(error, res);
    }
};

export const getAbsentEmployees = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { FromDate, ToDate } = req.query;

        if (!FromDate || !ToDate) {
            return invalidInput(res, "FromDate and ToDate are required");
        }

        // Get all attendance records
        const records = await getMultipleEmployeesAttendance(
            FromDate as string,
            new Date(new Date(ToDate as string).setDate(new Date(ToDate as string).getDate() + 1)).toISOString()
        );

        // Filter absent records
        const absentRecords = records.filter(r => r.AttendanceStatus === 'A');

        return dataFound(res, absentRecords);

    } catch (error) {
        console.error('Error in getAbsentEmployees:', error);
        return servError(error, res);
    }
};

export const getPresentEmployees = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { FromDate, ToDate } = req.query;

        if (!FromDate || !ToDate) {
            return invalidInput(res, "FromDate and ToDate are required");
        }

        // Get all attendance records
        const records = await getMultipleEmployeesAttendance(
            FromDate as string,
            new Date(new Date(ToDate as string).setDate(new Date(ToDate as string).getDate() + 1)).toISOString()
        );

        // Filter present records
        const presentRecords = records.filter(r => r.AttendanceStatus === 'P');

        return dataFound(res, presentRecords);

    } catch (error) {
        console.error('Error in getPresentEmployees:', error);
        return servError(error, res);
    }
};

export const getAttendanceStats = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { FromDate, ToDate } = req.query;

        if (!FromDate || !ToDate) {
            return invalidInput(res, "FromDate and ToDate are required");
        }

        // Get all attendance records
        const records = await getMultipleEmployeesAttendance(
            FromDate as string,
            new Date(new Date(ToDate as string).setDate(new Date(ToDate as string).getDate() + 1)).toISOString()
        );

        // Calculate statistics
        const uniqueEmployees = [...new Set(records.map(r => r.fingerPrintEmpId))].length;
        const presentCount = records.filter(r => r.AttendanceStatus === 'P').length;
        const absentCount = records.filter(r => r.AttendanceStatus === 'A').length;
        const leaveCount = records.filter(r => r.AttendanceStatus === 'L').length;
        
        const stats = {
            totalEmployees: uniqueEmployees,
            totalPresent: presentCount,
            totalAbsent: absentCount,
            totalLeave: leaveCount,
            attendanceRate: records.length > 0 
                ? Number(((presentCount / records.length) * 100).toFixed(2))
                : 0
        };

        return dataFound(res, [stats]);

    } catch (error) {
        console.error('Error in getAttendanceStats:', error);
        return servError(error, res);
    }
};

// ==================== PRIVATE HELPER FUNCTIONS ====================

/**
 * Get attendance for a single employee by EmpId
 */
const getSingleEmployeeAttendance = async (
    FromDate: string,
    ToDate: string,
    EmpId: string
): Promise<AttendanceResult[]> => {
    
    const query = `
        WITH RankedLogs AS (
            SELECT 
                em.User_Mgt_Id,          
                COALESCE(u.Name, '') AS username,  
                u.isActive,
                em.fingerPrintEmpId,
                al.AttendanceDate AS LogDateTime,           
                CAST(al.AttendanceDate AS DATE) AS LogDate,  
                ROW_NUMBER() OVER (
                    PARTITION BY em.User_Mgt_Id, CAST(al.AttendanceDate AS DATE) 
                    ORDER BY al.AttendanceDate
                ) AS rn, 
                COUNT(*) OVER (
                    PARTITION BY em.User_Mgt_Id, CAST(al.AttendanceDate AS DATE)
                ) AS record_count  
            FROM tbl_Employee_Master em
            LEFT JOIN tbl_Users u 
                ON u.id = em.User_Mgt_Id
            LEFT JOIN etimetracklite1.dbo.Employees pd 
                ON CAST(pd.EmployeeCode AS NVARCHAR(50)) = em.fingerPrintEmpId
            LEFT JOIN etimetracklite1.dbo.AttendanceLogs al 
                ON al.EmployeeId = pd.EmployeeId
            WHERE 
                COALESCE(u.isActive, 0) != 1 
                AND al.status != 'Resigned'
        ),
        DefaultLeaves AS (
            SELECT 
                CAST(Date AS DATE) AS DefaultLeaveDate
            FROM tbl_Default_Leave
            WHERE 
                Date >= CAST(@FromDate AS DATE)
                AND Date < CAST(@ToDate AS DATE)
        ),
        PunchDetails AS (
            SELECT 
                em.User_Mgt_Id, 
                CAST(al.AttendanceDate AS DATE) AS LogDate,
                COALESCE(
                    STRING_AGG(SUBSTRING(al.PunchRecords, 1, 5000), ', '), 
                    '[]'
                ) AS PunchDateTimes
            FROM tbl_Employee_Master em
            LEFT JOIN etimetracklite1.dbo.Employees pd 
                ON CAST(pd.EmployeeCode AS NVARCHAR(50)) = em.fingerPrintEmpId
            LEFT JOIN etimetracklite1.dbo.AttendanceLogs al 
                ON al.EmployeeId = pd.EmployeeId
            WHERE 
                al.status != 'Resigned'
                AND ISNULL(CAST(al.PunchRecords AS NVARCHAR(MAX)), '') <> ''
            GROUP BY em.User_Mgt_Id, CAST(al.AttendanceDate AS DATE)
        ),
        LeaveDays AS (
            SELECT 
                lm.User_Id,
                DATEADD(DAY, n.number, CAST(lm.FromDate AS DATE)) AS LeaveDate
            FROM tbl_Leave_Master lm
            CROSS JOIN (
                SELECT number 
                FROM master.dbo.spt_values 
                WHERE type = 'P' 
                  AND number BETWEEN 0 AND 1000 
            ) n
            WHERE 
                lm.Status = 'Approved'
                AND DATEADD(DAY, n.number, CAST(lm.FromDate AS DATE)) <= CAST(lm.ToDate AS DATE)
        )
        SELECT 
            e.User_Mgt_Id AS fingerPrintEmpId, 
            COALESCE(d.Designation, 'NOT FOUND') AS Designation_Name, 
            COALESCE(rl.username, '') AS username,  
            rl.LogDate,
            COALESCE(ag.PunchDateTimes, '[]') AS AttendanceDetails, 
            COALESCE(MAX(rl.record_count), 0) AS TotalRecords,
            CASE 
                WHEN DATEPART(WEEKDAY, rl.LogDate) = 1 THEN 'H'
                WHEN EXISTS (
                    SELECT 1 FROM LeaveDays ld
                    WHERE ld.User_Id = e.User_Mgt_Id 
                      AND ld.LeaveDate = rl.LogDate
                ) THEN 'L'
                WHEN EXISTS (
                    SELECT 1 FROM DefaultLeaves dl
                    WHERE dl.DefaultLeaveDate = rl.LogDate
                ) THEN 'DL'
                WHEN COALESCE(ag.PunchDateTimes, '') <> '' THEN 'P' 
                ELSE 'A' 
            END AS AttendanceStatus
        FROM tbl_Employee_Master e
        LEFT JOIN tbl_Employee_Designation d 
            ON e.Designation = d.Designation_Id
        LEFT JOIN tbl_Users u 
            ON e.User_Mgt_Id = u.id
        LEFT JOIN RankedLogs rl 
            ON e.User_Mgt_Id = rl.User_Mgt_Id
        LEFT JOIN PunchDetails ag 
            ON ag.User_Mgt_Id = rl.User_Mgt_Id
           AND ag.LogDate = rl.LogDate
        WHERE 
            rl.LogDate IS NOT NULL 
            AND rl.LogDate >= CAST(@FromDate AS DATETIME) 
            AND rl.LogDate < CAST(@ToDate AS DATETIME)
            AND e.User_Mgt_Id = @EmpCode
            AND COALESCE(u.isActive, 0) != 1
        GROUP BY 
            e.User_Mgt_Id,
            d.Designation, 
            rl.username,  
            rl.LogDate, 
            ag.PunchDateTimes
        ORDER BY rl.LogDate DESC
    `;

    const request = new sql.Request();
    request.input("FromDate", sql.DateTime, FromDate);
    request.input("ToDate", sql.DateTime, ToDate);
    request.input("EmpCode", sql.NVarChar, EmpId);

    const result = await request.query<AttendanceResult>(query);
    return result.recordset;
};


const getMultipleEmployeesAttendance = async (
    FromDate: string,
    ToDate: string,
    FingerPrintId?: string
): Promise<AttendanceResult[]> => {
    
    const filterCondition = !FingerPrintId || FingerPrintId === "ALL" || FingerPrintId === "0"
        ? ""
        : "AND em.fingerPrintEmpId = @FingerPrintId";

    const query = `
        WITH RankedLogs AS (
            SELECT 
                em.fingerPrintEmpId,
                em.User_Mgt_Id,
                em.Emp_Name AS username,
                pd.EmployeeCode,
                pd.EmployeeId,
                al.AttendanceDate AS LogDateTime,
                CAST(al.AttendanceDate AS DATE) AS LogDate,
                ROW_NUMBER() OVER (
                    PARTITION BY em.fingerPrintEmpId, CAST(al.AttendanceDate AS DATE)
                    ORDER BY al.AttendanceDate
                ) AS rn,
                COUNT(*) OVER (
                    PARTITION BY em.fingerPrintEmpId, CAST(al.AttendanceDate AS DATE)
                ) AS record_count
            FROM tbl_Employee_Master em
            LEFT JOIN etimetracklite1.dbo.Employees pd
                ON CAST(pd.EmployeeCode AS NVARCHAR(50)) = em.fingerPrintEmpId
            LEFT JOIN etimetracklite1.dbo.AttendanceLogs al
                ON al.EmployeeId = pd.EmployeeId
            WHERE
                al.status != 'Resigned'
                ${filterCondition}
        ),
        DefaultLeaves AS (
            SELECT 
                CAST(Date AS DATE) AS DefaultLeaveDate
            FROM tbl_Default_Leave
            WHERE 
                Date >= CAST(@FromDate AS DATE)
                AND Date < CAST(@ToDate AS DATE)
        ),
        PunchDetails AS (
            SELECT 
                pd.EmployeeCode, 
                CAST(al.AttendanceDate AS DATE) AS LogDate,
                COALESCE(
                    STRING_AGG(SUBSTRING(al.PunchRecords, 1, 5000), ', '), 
                    '[]'
                ) AS PunchDateTimes
            FROM etimetracklite1.dbo.Employees pd 
            LEFT JOIN etimetracklite1.dbo.AttendanceLogs al 
                ON al.EmployeeId = pd.EmployeeId
            WHERE 
                al.status != 'Resigned'
                AND ISNULL(CAST(al.PunchRecords AS NVARCHAR(MAX)), '') <> ''
            GROUP BY pd.EmployeeCode, CAST(al.AttendanceDate AS DATE)
        ),
        LeaveDays AS (
            SELECT 
                lm.User_Id,
                DATEADD(DAY, n.number, CAST(lm.FromDate AS DATE)) AS LeaveDate
            FROM tbl_Leave_Master lm
            CROSS JOIN (
                SELECT number FROM master.dbo.spt_values 
                WHERE type = 'P' 
                AND number BETWEEN 0 AND 1000 
            ) n
            WHERE 
                lm.Status = 'Approved'
                AND DATEADD(DAY, n.number, CAST(lm.FromDate AS DATE)) <= CAST(lm.ToDate AS DATE)
        )
        SELECT 
            em.fingerPrintEmpId, 
            COALESCE(d.Designation, 'NOT FOUND') AS Designation_Name, 
            COALESCE(rl.username, '') AS username,  
            rl.LogDate,
            COALESCE(ag.PunchDateTimes, '[]') AS AttendanceDetails, 
            COALESCE(MAX(rl.record_count), 0) AS TotalRecords,
            CASE 
                WHEN DATEPART(WEEKDAY, rl.LogDate) = 1 THEN 'H'
                WHEN EXISTS (
                    SELECT 1 FROM LeaveDays ld
                    WHERE ld.User_Id = rl.User_Mgt_Id 
                      AND ld.LeaveDate = rl.LogDate
                ) THEN 'L'
                WHEN EXISTS (
                    SELECT 1 FROM DefaultLeaves dl
                    WHERE dl.DefaultLeaveDate = rl.LogDate
                ) THEN 'DL'
                WHEN COALESCE(ag.PunchDateTimes, '') <> '' THEN 'P' 
                ELSE 'A' 
            END AS AttendanceStatus
        FROM tbl_Employee_Master em
        LEFT JOIN tbl_Employee_Designation d ON em.Designation = d.Designation_Id
        LEFT JOIN RankedLogs rl ON em.fingerPrintEmpId = rl.fingerPrintEmpId
        LEFT JOIN PunchDetails ag 
            ON ag.EmployeeCode = rl.EmployeeCode 
            AND ag.LogDate = rl.LogDate
        WHERE 
            rl.LogDate IS NOT NULL 
            AND rl.LogDate >= CAST(@FromDate AS DATETIME) 
            AND rl.LogDate < CAST(@ToDate AS DATETIME)
        GROUP BY 
            em.fingerPrintEmpId, 
            d.Designation, 
            rl.username,  
            rl.LogDate, 
            ag.PunchDateTimes,
            rl.User_Mgt_Id  -- Added this to fix the GROUP BY error
        ORDER BY rl.LogDate DESC;
    `;

    const request = new sql.Request();
    request.input("FromDate", sql.DateTime, FromDate);
    request.input("ToDate", sql.DateTime, ToDate);

    if (FingerPrintId && FingerPrintId !== "ALL" && FingerPrintId !== "0") {
        request.input("FingerPrintId", sql.NVarChar, FingerPrintId);
    }

    const result = await request.query<AttendanceResult>(query);
    return result.recordset;
};

export default {
    getFingerprintAttendance,
    getTodayAttendance,
    getEmployeeAttendanceSummary,
    getEmployeeAttendance,
    getDeviceAttendance,
    getAttendanceByDateRange,
    getMonthlyAttendance,
    getAbsentEmployees,
    getPresentEmployees,
    getAttendanceStats
};