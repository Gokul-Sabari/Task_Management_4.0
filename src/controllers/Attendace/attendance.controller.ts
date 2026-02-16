import sql from 'mssql';
import { Request, Response } from 'express';
import { servError, dataFound, noData, invalidInput, success, failed } from '../../responseObject';
import { checkIsNumber, ISOString, isEqualNumber } from '../../helper_functions';
import { getUserType } from '../../middleware/miniAPIs';
import uploadFile from '../../middleware/uploadMiddleware';
import getImageIfExist from '../../middleware/getImageIfExist';
import fileRemoverMiddleware from '../../middleware/unSyncFile';
import Attendance from '../../models/Attendance/employeeattentance/Attendance.model';
import { Op } from 'sequelize';
import { sequelize } from '../../config/sequalizer';
import { any } from 'zod';
import { QueryTypes } from 'sequelize';

interface AttendanceRecord {
    Id: number;
    UserId: number;
    Start_Date: Date;
    End_Date: Date | null;
    IsSalesPerson: number;
    Start_KM: number | null;
    End_KM: number | null;
    Latitude: number | null;
    Longitude: number | null;
    Start_KM_ImageName: string | null;
    End_KM_ImageName: string | null;
    Start_KM_ImagePath: string | null;
    End_KM_ImagePath: string | null;
    WorkSummary: string | null;
    Active_Status: number;
    [key: string]: any;
}

interface AttendanceWithImageUrls extends AttendanceRecord {
    startKmImageUrl: string | null;
    endKmImageUrl: string | null;
}

const toArr = <T>(arr: T | T[]): T[] => Array.isArray(arr) ? arr : [];


export const addAttendance = async (req: Request, res: Response): Promise<Response> => {
    try {
        await uploadFile(req, res, 2, 'Start_KM_Pic');

        const fileName = req?.file?.filename as string | undefined;
        const filePath = req?.file?.path as string | undefined;

        const { UserId, Start_KM, Latitude, Longitude } = req.body;

        if (!checkIsNumber(UserId)) {
            if (filePath) {
                await fileRemoverMiddleware(filePath);
            }
            return invalidInput(res, 'UserId is required');
        }

        const isSalesPerson: number = (await getUserType(Number(UserId))) == 6 ? 1 : 0;

        const newAttendance = await Attendance.create({
            UserId: Number(UserId),
            Start_Date: new Date(),
            IsSalesPerson: isSalesPerson,
            Start_KM: Start_KM ? Number(Start_KM) : null,
            Latitude: Latitude ? Number(Latitude) : null,
            Longitude: Longitude ? Number(Longitude) : null,
            Start_KM_ImageName: fileName || null,
            Start_KM_ImagePath: filePath || null,
            Active_Status: 1
        });

        if (newAttendance) {
            return success(res, 'Attendance Noted!');
        } else {
            return failed(res, 'Failed to Add Attendance');
        }
    } catch (e) {
        console.error('Error in addAttendance:', e);
        if (req.file?.path) {
            await fileRemoverMiddleware(req.file.path);
        }
        return servError(e, res);
    }
};


export const getMyLastAttendance = async (req: Request, res: Response): Promise<Response> => {
    const { UserId } = req.query;
  
    if (!checkIsNumber(UserId)) {
        return invalidInput(res, 'UserId is required');
    }

    try {
     
        
        const attendances = await Attendance.findAll({
            where: {
                UserId: Number(UserId)
            },
            order: [['Start_Date', 'DESC']],
            limit: 1
        });

      

        if (attendances.length > 0) {
            const withImg: AttendanceWithImageUrls[] = attendances.map((o: any) => {
                const jsonData = o.toJSON();
                return {
                    ...jsonData,
                    startKmImageUrl: jsonData?.Start_KM_ImageName ? getImageIfExist('attendance', jsonData.Start_KM_ImageName) : null,
                    endKmImageUrl: jsonData?.End_KM_ImageName ? getImageIfExist('attendance', jsonData.End_KM_ImageName) : null
                };
            });
            return dataFound(res, withImg);
        } else {
            return noData(res);
        }
    } catch (e) {
        console.error('Error in getMyLastAttendance:', e);
        return servError(e, res);
    }
};


export const closeAttendance = async (req: Request, res: Response): Promise<Response> => {
    try {
        await uploadFile(req, res, 2, 'End_KM_Pic');

        const fileName = req?.file?.filename as string | undefined;
        const filePath = req?.file?.path as string | undefined;

        const { Id, End_KM, Description } = req.body;

        if (!checkIsNumber(Id)) {
            if (filePath) {
                await fileRemoverMiddleware(filePath);
            }
            return invalidInput(res, 'Id is required');
        }

        // First check if attendance exists
        const existingAttendance = await Attendance.findByPk(Number(Id));
        
        if (!existingAttendance) {
            if (filePath) {
                await fileRemoverMiddleware(filePath);
            }
            return invalidInput(res, 'Attendance record not found');
        }

        const [updatedCount] = await Attendance.update(
            {
                End_Date: new Date(),
                End_KM: End_KM ? Number(End_KM) : null,
                End_KM_ImageName: fileName || null,
                End_KM_ImagePath: filePath || null,
                WorkSummary: Description || null,
                Active_Status: 0
            },
            {
                where: {
                    Id: Number(Id)
                }
            }
        );

        if (updatedCount > 0) {
            return success(res, 'Attendance Closed');
        } else {
            return failed(res, 'Failed to Close Attendance');
        }
    } catch (e) {
        console.error('Error in closeAttendance:', e);
        if (req.file?.path) {
            await fileRemoverMiddleware(req.file.path);
        }
        return servError(e, res);
    }
};


export const getAttendanceHistory = async (req: Request, res: Response): Promise<Response> => {
    const { UserId, UserTypeID, Branch_Id } = req.query;

    const From = req.query?.From ? ISOString(req.query?.From as string) : ISOString();
    const To = req.query?.To ? ISOString(req.query?.To as string) : ISOString();

    if (!checkIsNumber(UserTypeID)) {
        return invalidInput(res, 'UserTypeID is required');
    }

    const isSalesPerson = Number(UserTypeID) == 6;

    try {
        
        
        const request = new sql.Request()
            .input('from', From)
            .input('to', To)
            .input('userid', UserId)
            .input('isSalesPerson', isSalesPerson ? 1 : 0)
            .input('Branch_Id', Branch_Id)
            .query(`
                SELECT
                    a.*,
                    u.Name AS User_Name,
                    u.BranchId AS Branch_Id
                FROM
                    tbl_Attendance AS a
                    LEFT JOIN tbl_Users AS u ON u.id = a.UserId
                WHERE
                    CONVERT(DATE, a.Start_Date) >= CONVERT(DATE, @from)
                    AND CONVERT(DATE, a.Start_Date) <= CONVERT(DATE, @to)
                    ${checkIsNumber(UserId as string) ? ' AND a.UserId = @userid ' : ''}
                    ${checkIsNumber(Branch_Id as string) ? ' AND u.BranchId = @Branch_Id ' : ''}
                    ${(isEqualNumber(Number(UserTypeID), 3) || isEqualNumber(Number(UserTypeID), 6)) ? ' AND a.IsSalesPerson = @isSalesPerson ' : ''}
                ORDER BY a.Start_Date DESC, a.UserId`);

        const result = await request;


        if (result.recordset.length > 0) {
            const withImg: AttendanceWithImageUrls[] = result.recordset.map((o: AttendanceRecord) => ({
                ...o,
                startKmImageUrl: o?.Start_KM_ImageName ? getImageIfExist('attendance', o.Start_KM_ImageName) : null,
                endKmImageUrl: o?.End_KM_ImageName ? getImageIfExist('attendance', o.End_KM_ImageName) : null
            }));
            return dataFound(res, withImg);
        } else {
            return noData(res);
        }
    } catch (e) {
        console.error('Error in getAttendanceHistory:', e);
        return servError(e, res);
    }
};


export const getAttendanceHistorySequelize = async (req: Request, res: Response): Promise<Response> => {
    const { UserId, UserTypeID } = req.query;

    const From = req.query?.From ? req.query.From as string : '';
    const To = req.query?.To ? req.query.To as string : '';

    try {
     
        
        const whereCondition: any = {};

        if (From && To) {
            whereCondition[Op.and] = [
                sequelize.literal(`CONVERT(DATE, Start_Date) >= CONVERT(DATE, '${From}')`),
                sequelize.literal(`CONVERT(DATE, Start_Date) <= CONVERT(DATE, '${To}')`)
            ];
        } else if (From) {
            whereCondition[Op.and] = sequelize.literal(`CONVERT(DATE, Start_Date) >= CONVERT(DATE, '${From}')`);
        } else if (To) {
            whereCondition[Op.and] = sequelize.literal(`CONVERT(DATE, Start_Date) <= CONVERT(DATE, '${To}')`);
        }

        if (checkIsNumber(UserId as string)) {
            whereCondition.UserId = Number(UserId);
        }

        if (checkIsNumber(UserTypeID) && (Number(UserTypeID) === 3 || Number(UserTypeID) === 6)) {
            const isSalesPerson = Number(UserTypeID) === 6 ? 1 : 0;
            whereCondition.IsSalesPerson = isSalesPerson;
        }

        const attendances = await Attendance.findAll({
            where: whereCondition,
            order: [['Start_Date', 'DESC']]
        });

        if (attendances.length > 0) {
            const withImg: AttendanceWithImageUrls[] = attendances.map((o: any) => {
                const jsonData = o.toJSON();
                return {
                    ...jsonData,
                    startKmImageUrl: jsonData?.Start_KM_ImageName ? getImageIfExist('attendance', jsonData.Start_KM_ImageName) : null,
                    endKmImageUrl: jsonData?.End_KM_ImageName ? getImageIfExist('attendance', jsonData.End_KM_ImageName) : null
                };
            });
            return dataFound(res, withImg);
        } else {
            return noData(res);
        }
    } catch (e) {
        console.error('Error in getAttendanceHistorySequelize:', e);
        return servError(e, res);
    }
};


export const getDepartment = async (req: Request, res: Response): Promise<Response> => {
    try {
        const request = new sql.Request()
            .query(`
                SELECT DISTINCT 
                    Department AS value, 
                    Department AS label
                FROM tbl_Employee_Master
                WHERE Department IS NOT NULL AND Department != ''
                ORDER BY Department`);

        const result = await request;
        return dataFound(res, toArr(result.recordset));
    } catch (e) {
        console.error('Error in getDepartment:', e);
        return servError(e, res);
    }
};

export const getEmployeesByDepartment = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { department } = req.body;

        if (!department) {
            return invalidInput(res, "Department is required");
        }

        const request = new sql.Request()
            .input("Department", sql.VarChar, department)
            .query(`
                SELECT 
                    Emp_Name AS label, 
                    Emp_Id AS value
                FROM tbl_Employee_Master
                WHERE Department = @Department
                ORDER BY Emp_Name`
            );

        const result = await request;
        return dataFound(res, toArr(result.recordset));
    } catch (e) {
        console.error('Error in getEmployeesByDepartment:', e);
        return servError(e, res);
    }
};

export const getAttendanceStats = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { fromDate, toDate, userId } = req.query;

    
        const whereCondition: any = {};

        if (fromDate && toDate) {
            whereCondition[Op.and] = [
                sequelize.literal(`CONVERT(DATE, Start_Date) >= CONVERT(DATE, '${fromDate}')`),
                sequelize.literal(`CONVERT(DATE, Start_Date) <= CONVERT(DATE, '${toDate}')`)
            ];
        }


        if (userId && checkIsNumber(userId as string)) {
            whereCondition.UserId = Number(userId);
        }

      
        const stats = await Attendance.findAll({
            where: whereCondition,
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('Id')), 'totalAttendance'],
                [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('UserId'))), 'uniqueUsers'],
                [sequelize.fn('SUM', sequelize.literal('CASE WHEN Active_Status = 1 THEN 1 ELSE 0 END')), 'activeSessions'],
                [sequelize.fn('SUM', sequelize.literal('CASE WHEN Active_Status = 0 THEN 1 ELSE 0 END')), 'completedSessions'],
                [sequelize.fn('SUM', sequelize.literal('CASE WHEN IsSalesPerson = 1 THEN 1 ELSE 0 END')), 'salesPersonAttendance']
            ],
            raw: true
        });


        const result = stats && stats.length > 0 ? stats[0] : {
            totalAttendance: 0,
            uniqueUsers: 0,
            activeSessions: 0,
            completedSessions: 0,
            salesPersonAttendance: 0
        };


        return dataFound(res, [result]);
        
    } catch (e) {
        console.error('Error in getAttendanceStats:', e);
        return servError(e, res);
    }
};


export const getUserAttendanceSummary = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { UserId, year, month } = req.query;

        if (!checkIsNumber(UserId)) {
            return invalidInput(res, 'UserId is required');
        }
        let startDateStr: string;
        let endDateStr: string;

        if (year && month) {
            const yearNum = Number(year);
            const monthNum = Number(month);
            
            if (monthNum < 1 || monthNum > 12) {
                return invalidInput(res, 'Month must be between 1 and 12');
            }
            
            startDateStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;
            
            const lastDay = new Date(yearNum, monthNum, 0).getDate();
            endDateStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${lastDay}`;
        } else {
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth() + 1;
            
            startDateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
            
            const lastDay = new Date(currentYear, currentMonth, 0).getDate();
            endDateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${lastDay}`;
        }

  

        const attendances = await sequelize.query(`
            SELECT 
                Id,
                UserId,
                Start_Date,
                End_Date,
                IsSalesPerson,
                Start_KM,
                End_KM,
                Latitude,
                Longitude,
                Start_KM_ImageName,
                End_KM_ImageName,
                Start_KM_ImagePath,
                End_KM_ImagePath,
                WorkSummary,
                Active_Status
            FROM tbl_Attendance 
            WHERE 
                UserId = ? 
                AND CONVERT(DATE, Start_Date) >= CONVERT(DATE, ?)
                AND CONVERT(DATE, Start_Date) <= CONVERT(DATE, ?)
            ORDER BY Start_Date DESC
        `, {
            replacements: [Number(UserId), startDateStr, endDateStr],
            type: QueryTypes.SELECT
        });

      

        const summary = {
            totalDays: attendances.length,
            presentDays: attendances.filter((a: any) => a.Active_Status === 0 && a.End_Date !== null).length,
            activeDays: attendances.filter((a: any) => a.Active_Status === 1).length,
            totalWorkHours: Number(attendances
                .filter((a: any) => a.End_Date !== null)
                .reduce((total: number, a: any) => {
                    try {
                        const startTime = new Date(a.Start_Date).getTime();
                        const endTime = new Date(a.End_Date).getTime();
                        const hours = (endTime - startTime) / (1000 * 60 * 60);
                        return total + (hours > 0 ? hours : 0);
                    } catch (err) {
                        console.error('Error calculating hours for attendance:', a.Id, err);
                        return total;
                    }
                }, 0).toFixed(2))
        };

        return dataFound(res, [summary]);
        
    } catch (e) {
        console.error('Error in getUserAttendanceSummary:', e);
        return servError(e, res);
    }
};

export default {
    addAttendance,
    getMyLastAttendance,
    closeAttendance,
    getAttendanceHistory,
    getAttendanceHistorySequelize,
    getDepartment,
    getEmployeesByDepartment,
    getAttendanceStats,
    getUserAttendanceSummary
};