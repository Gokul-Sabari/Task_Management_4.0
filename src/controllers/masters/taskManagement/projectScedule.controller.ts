// src/controllers/masters/projectManagement/projectSchedule.controller.ts
import { Request, Response } from 'express';
import {
    created,
    updated,
    deleted,
    servError,
    notFound,
    sentData
} from '../../../responseObject';
import {
    ScheduleCreateSchema,
    ScheduleUpdateSchema,
    ScheduleQuerySchema,
    ScheduleIdSchema,
    ScheduleStatusUpdateSchema,
    ScheduleDetailSchema,
    ScheduleCreate,
    ScheduleUpdate,
    ScheduleQuery,
    ScheduleStatusUpdate
} from '../../../models/masters/ProjectSchedule/schedule.type.model';
import { ZodError } from 'zod';
import { sequelize } from '../../../config/sequalizer';

import { QueryTypes } from 'sequelize';

const validateWithZod = <T>(schema: any, data: any): {
    success: boolean;
    data?: T;
    errors?: Array<{ field: string; message: string }>;
} => {
    try {
        return { success: true, data: schema.parse(data) };
    } catch (error) {
        if (error instanceof ZodError) {
            return {
                success: false,
                errors: error.issues.map(err => ({
                    field: err.path.join('.') || 'unknown',
                    message: err.message
                }))
            };
        }
        return {
            success: false,
            errors: [{ field: 'unknown', message: 'Validation failed' }]
        };
    }
};

export const getAllSchedules = async (req: Request, res: Response) => {
    try {
        const validation = validateWithZod<ScheduleQuery>(
            ScheduleQuerySchema,
            req.query
        );

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid query parameters',
                errors: validation.errors
            });
        }

        const { 
            status,
            planType,
            taskId,
            dateFrom,
            dateTo
        } = validation.data!;

        const validSortFields = ['Sch_Id', 'Sch_No', 'Sch_Date', 'Task_Name', 'Sch_Status', 'Entry_Date'];
      
        let whereConditions = ['s.Sch_Del_Flag = 0'];
        const params: any[] = [];
        let paramCounter = 1;

        if (status) {
            whereConditions.push(`s.Sch_Status = @${paramCounter}`);
            params.push(status);
            paramCounter++;
        }

        if (planType) {
            whereConditions.push(`s.Sch_Plan_Id = @${paramCounter}`);
            params.push(planType);
            paramCounter++;
        }

        if (taskId) {
            whereConditions.push(`s.Task_Id = @${paramCounter}`);
            params.push(taskId);
            paramCounter++;
        }

        if (dateFrom) {
            whereConditions.push(`s.Sch_Date >= @${paramCounter}`);
            params.push(dateFrom);
            paramCounter++;
        }

        if (dateTo) {
            whereConditions.push(`s.Sch_Date <= @${paramCounter}`);
            params.push(dateTo);
            paramCounter++;
        }

        const whereClause = whereConditions.length > 0 
            ? 'WHERE ' + whereConditions.join(' AND ') 
            : '';

 
        const countQuery = `
            SELECT COUNT(*) as total
            FROM tbl_Project_Schedule s
            LEFT JOIN tbl_Task t ON s.Task_Id = t.Task_Id
            ${whereClause}
        `;

        const countResult = await sequelize.query(countQuery, {
            replacements: params.reduce((acc, val, idx) => {
                acc[`${idx + 1}`] = val;
                return acc;
            }, {}),
            type: 'SELECT'
        }) as any[];

        const total = countResult[0]?.total || 0;


        const schedulesQuery = `
            SELECT 
                s.Sch_Id, s.Sch_No, s.Sch_Date, s.Task_Id, t.Task_Name,
                s.Sch_Type_Id, s.Sch_Plan_Id, p.Plan_Type,
                s.Sch_Start_Date, s.Sch_End_Date, s.Task_Sch_Timer_Based,
                s.Sch_Est_Start_Time, s.Sch_Est_End_Time, s.Task_Sch_Duaration,
                s.Sch_Status, s.Entry_By, s.Entry_Date, s.Update_By, s.Update_Date,
                sd.Plan_Week, sd.Plan_Month, sd.Plan_Day
            FROM tbl_Project_Schedule s
            LEFT JOIN tbl_Task t ON s.Task_Id = t.Task_Id
            LEFT JOIN tbl_Sch_Plan p ON s.Sch_Plan_Id = p.Plan_Id
            LEFT JOIN tbl_Project_Sch_DT sd ON s.Sch_Id = sd.Sch_Id
            ${whereClause}
        `;

        const schedules = await sequelize.query(schedulesQuery, {
            replacements: params.reduce((acc, val, idx) => {
                acc[`${idx + 1}`] = val;
                return acc;
            }, {}),
            type: 'SELECT'
        }) as any[];

    
        const scheduleIds = schedules.map(s => s.Sch_Id);
        
        if (scheduleIds.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'Project schedules retrieved successfully',
                data: [],
                
            });
        }

       
        const taskDatesQuery = `
            SELECT 
                A_Id,
                Sch_Id,
                Task_Work_Date,
                Task_Start_Time,
                Task_End_Time
            FROM tbl_Project_Sch_Task_DT 
            WHERE Sch_Id IN (${scheduleIds.map(() => '?').join(',')})
            ORDER BY Sch_Id, Task_Work_Date
        `;

        const taskDates = await sequelize.query(taskDatesQuery, {
            replacements: scheduleIds,
            type: 'SELECT'
        }) as any[];

        const planDetailsQuery = `
            SELECT 
                Sch_Id,
                Plan_Week,
                Plan_Month,
                Plan_Day
            FROM tbl_Project_Sch_DT 
            WHERE Sch_Id IN (${scheduleIds.map(() => '?').join(',')})
        `;

        const planDetails = await sequelize.query(planDetailsQuery, {
            replacements: scheduleIds,
            type: 'SELECT'
        }) as any[];

       
        const taskDatesByScheduleId: { [key: number]: any[] } = {};
        const planDetailsByScheduleId: { [key: number]: any[] } = {};

        taskDates.forEach(task => {
            if (!taskDatesByScheduleId[task.Sch_Id]) {
                taskDatesByScheduleId[task.Sch_Id] = [];
            }
            taskDatesByScheduleId[task.Sch_Id].push({
                aId: task.A_Id,
                taskWorkDate: task.Task_Work_Date,
                taskStartTime: task.Task_Start_Time,
                taskEndTime: task.Task_End_Time
            });
        });

        planDetails.forEach(plan => {
            if (!planDetailsByScheduleId[plan.Sch_Id]) {
                planDetailsByScheduleId[plan.Sch_Id] = [];
            }
            planDetailsByScheduleId[plan.Sch_Id].push({
                planWeek: plan.Plan_Week,
                planMonth: plan.Plan_Month,
                planDay: plan.Plan_Day
            });
        });

 
        const scheduleMap = new Map();
        
        schedules.forEach(schedule => {
            const schId = schedule.Sch_Id;
            
            if (!scheduleMap.has(schId)) {
                scheduleMap.set(schId, {
                    schId: schedule.Sch_Id,
                    schNo: schedule.Sch_No,
                    schDate: schedule.Sch_Date,
                    taskId: schedule.Task_Id,
                    taskName: schedule.Task_Name,
                    schTypeId: schedule.Sch_Type_Id,
                    schPlanId: schedule.Sch_Plan_Id,
                    planType: schedule.Plan_Type,
                    schStartDate: schedule.Sch_Start_Date,
                    schEndDate: schedule.Sch_End_Date,
                    taskSchTimerBased: schedule.Task_Sch_Timer_Based,
                    schEstStartTime: schedule.Sch_Est_Start_Time,
                    schEstEndTime: schedule.Sch_Est_End_Time,
                    taskSchDuration: schedule.Task_Sch_Duaration,
                    schStatus: schedule.Sch_Status,
                    entryBy: schedule.Entry_By,
                    entryDate: schedule.Entry_Date,
                    updateBy: schedule.Update_By,
                    updateDate: schedule.Update_Date,
                    taskDates: taskDatesByScheduleId[schId] || [],
                    planDetails: planDetailsByScheduleId[schId] || []
                });
            }
        });

      
        const formattedSchedules = Array.from(scheduleMap.values());

        res.status(200).json({
            success: true,
            message: 'Project schedules retrieved successfully',
            data: formattedSchedules,
          
        });
    } catch (e) {
        servError(e, res);
    }
};

export const getScheduleById = async (req: Request, res: Response) => {
    try {
        const validation = validateWithZod<{ id: number }>(
            ScheduleIdSchema,
            req.params
        );

        if (!validation.success) {
            return res.status(400).json({ 
                success: false, 
                errors: validation.errors 
            });
        }

        const query = `
            SELECT 
                s.*, t.Task_Name, p.Plan_Type,
                sd.Plan_Week, sd.Plan_Month, sd.Plan_Day
            FROM tbl_Project_Schedule s
            LEFT JOIN tbl_Task t ON s.Task_Id = t.Task_Id
            LEFT JOIN tbl_Sch_Plan p ON s.Sch_Plan_Id = p.Plan_Id
            LEFT JOIN tbl_Project_Sch_DT sd ON s.Sch_Id = sd.Sch_Id
            WHERE s.Sch_Id = ? AND s.Sch_Del_Flag = 0
        `;

        const rows = await sequelize.query(query, {
            replacements: [validation.data!.id],
            type: 'SELECT'
        }) as any[];

        if (!rows.length) {
            return notFound(res, 'Project schedule not found');
        }

        const detailsQuery = `
            SELECT * FROM tbl_Project_Sch_Task_DT 
            WHERE Sch_Id = ?
        `;

        const details = await sequelize.query(detailsQuery, {
            replacements: [validation.data!.id],
            type: 'SELECT'
        }) as any[];

        const result = {
            schedule: rows[0],
            scheduleDetails: details,
            planDetails: {
                Plan_Week: rows[0].Plan_Week,
                Plan_Month: rows[0].Plan_Month,
                Plan_Day: rows[0].Plan_Day
            }
        };

        sentData(res, [result]);
    } catch (e) {
        servError(e, res);
    }
};


export const getScheduleDetails = async (req: Request, res: Response) => {
    try {
        const validation = validateWithZod<{ id: number }>(
            ScheduleIdSchema,
            req.params
        );

        if (!validation.success) {
            return res.status(400).json({ 
                success: false, 
                errors: validation.errors 
            });
        }

        const query = `
            SELECT * FROM tbl_Project_Sch_Task_DT 
            WHERE Sch_Id = ?
            ORDER BY Task_Work_Date
        `;

        const rows = await sequelize.query(query, {
            replacements: [validation.data!.id],
            type: 'SELECT'
        }) as any[];

        sentData(res, rows);
    } catch (e) {
        servError(e, res);
    }
};

export const createSchedule = async (req: Request, res: Response) => {
    let transaction;
    
    try {
        const body = {
            ...req.body,
            Sch_No: req.body.Sch_No?.trim(),
            Sch_Status: req.body.Sch_Status || 'Active'
        };

        const validation = validateWithZod<ScheduleCreate>(
            ScheduleCreateSchema,
            body
        );

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        const { 
            Sch_No, Sch_Date, Task_Id, Sch_Type_Id, Sch_Plan_Id,
            Sch_Start_Date, Sch_End_Date, Task_Sch_Timer_Based,
            Sch_Est_Start_Time, Sch_Est_End_Time, Task_Sch_Duaration,
            Sch_Status, Entry_By, selectedDays 
        } = validation.data!;

        const formatDateForSQL = (date: Date | string | null): string | null => {
            if (!date) return null;
            const d = date instanceof Date ? date : new Date(date);
            return d.toISOString().split('T')[0];
        };

        interface CheckResult {
            '': number;
        }

        interface MaxIdResult {
            CurrentMaxId: number;
            NextId: number;
        }

        interface MaxAIdResult {
            CurrentMaxAId: number;
            NextAId: number;
        }

        // Get plan type information
        const planTypeResult = await sequelize.query<{ Plan_Type: string }>(
            `SELECT Plan_Type FROM tbl_Sch_Plan WHERE Plan_Id = ?`,
            { 
                replacements: [Sch_Plan_Id], 
                type: QueryTypes.SELECT 
            }
        );

        const planType = planTypeResult[0]?.Plan_Type || '';

        // Duplicate check
        const dupCheck = await sequelize.query<CheckResult>(
            `SELECT 1 FROM tbl_Project_Schedule 
             WHERE UPPER(Sch_No) = UPPER(?) AND Sch_Del_Flag = 0`,
            { 
                replacements: [Sch_No], 
                type: QueryTypes.SELECT 
            }
        );

        if (dupCheck.length) {
            return res.status(409).json({
                success: false,
                message: 'Schedule number already exists'
            });
        }

        // Generate next Schedule ID
        const maxIdResult = await sequelize.query<MaxIdResult>(
            `SELECT 
                ISNULL(MAX(Sch_Id), 0) as CurrentMaxId,
                ISNULL(MAX(Sch_Id), 0) + 1 as NextId 
             FROM tbl_Project_Schedule`,
            { 
                type: QueryTypes.SELECT 
            }
        );

        const nextSchId = maxIdResult[0]?.NextId;
        
        if (!nextSchId) {
            throw new Error('Failed to generate next Schedule ID');
        }

        const idCheck = await sequelize.query<CheckResult>(
            `SELECT 1 FROM tbl_Project_Schedule WHERE Sch_Id = ?`,
            { 
                replacements: [nextSchId], 
                type: QueryTypes.SELECT 
            }
        );

        let finalSchId: number;

        if (idCheck.length > 0) {
            const availableIdResult = await sequelize.query<{ AvailableId: number }>(
                `SELECT TOP 1 
                    t1.Sch_Id + 1 as Sch_Id
                 FROM tbl_Project_Schedule t1
                 LEFT JOIN tbl_Project_Schedule t2 ON t1.Sch_Id + 1 = t2.Sch_Id
                 WHERE t2.Sch_Id IS NULL
                 ORDER BY t1.Sch_Id`,
                { 
                    type: QueryTypes.SELECT 
                }
            );

            finalSchId = availableIdResult[0]?.AvailableId || nextSchId + 1;
        } else {
            finalSchId = nextSchId;
        }

        // Start transaction and insert with the final ID
        transaction = await sequelize.transaction();

        try {
            // Insert main schedule
            const insertValues = [
                finalSchId,  
                Sch_No,
                formatDateForSQL(Sch_Date),
                Task_Id,
                Sch_Type_Id,
                Sch_Plan_Id,
                formatDateForSQL(Sch_Start_Date),
                formatDateForSQL(Sch_End_Date),
                Task_Sch_Timer_Based ? 1 : 0,
                Sch_Est_Start_Time,
                Sch_Est_End_Time,
                Task_Sch_Duaration,
                Sch_Status,
                Entry_By
            ];

            const insertQuery = `
                INSERT INTO tbl_Project_Schedule
                (Sch_Id, Sch_No, Sch_Date, Task_Id, Sch_Type_Id, Sch_Plan_Id,
                 Sch_Start_Date, Sch_End_Date, Task_Sch_Timer_Based,
                 Sch_Est_Start_Time, Sch_Est_End_Time, Task_Sch_Duaration,
                 Sch_Status, Entry_By, Entry_Date, Sch_Del_Flag)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE(), 0)
            `;

            await sequelize.query(insertQuery, {
                replacements: insertValues,
                type: QueryTypes.INSERT,
                transaction
            });

            // Handle date range if provided
            if (Sch_Start_Date && Sch_End_Date) {
                const startDate = new Date(Sch_Start_Date);
                const endDate = new Date(Sch_End_Date);
                
                // Generate all dates between start and end date
                const allDates = getDatesBetween(startDate, endDate);
                
                // Filter dates based on selected days (if any)
                const datesToInsert = selectedDays && selectedDays.length > 0
                    ? allDates.filter(date => selectedDays.includes(getDayOfWeek(date)))
                    : allDates;

                // Handle tbl_Project_Sch_DT insertion based on plan type
                if (Sch_Plan_Id !== 1 && Sch_Plan_Id !== 5) { // Not for Time Based or Specific Day
                    for (const date of datesToInsert) {
                        const planDetails = calculatePlanDetails(date, Sch_Plan_Id);
                        
                        await sequelize.query(
                            `INSERT INTO tbl_Project_Sch_DT
                             (Sch_Id, Plan_Week, Plan_Month, Plan_Day)
                             VALUES (?, ?, ?, ?)`,
                            {
                                replacements: [
                                    finalSchId,
                                    planDetails.week,
                                    planDetails.month,
                                    planDetails.day
                                ],
                                type: QueryTypes.INSERT,
                                transaction
                            }
                        );
                    }
                }

                // Handle tbl_Project_Sch_Task_DT for all plan types
                const maxAIdResult = await sequelize.query<MaxAIdResult>(
                    `SELECT 
                        ISNULL(MAX(A_Id), 0) as CurrentMaxAId,
                        ISNULL(MAX(A_Id), 0) + 1 as NextAId 
                     FROM tbl_Project_Sch_Task_DT`,
                    { 
                        type: QueryTypes.SELECT,
                        transaction 
                    }
                );

                let nextAId = maxAIdResult[0]?.NextAId || 1;

                // Insert into tbl_Project_Sch_Task_DT with generated A_Id
                for (const date of datesToInsert) {
                    // Check if this A_Id already exists (rare case)
                    const aIdCheck = await sequelize.query<CheckResult>(
                        `SELECT 1 FROM tbl_Project_Sch_Task_DT WHERE A_Id = ?`,
                        { 
                            replacements: [nextAId], 
                            type: QueryTypes.SELECT,
                            transaction
                        }
                    );

                    // If ID exists, find the next available ID
                    if (aIdCheck.length > 0) {
                        const availableAIdResult = await sequelize.query<{ AvailableId: number }>(
                            `SELECT TOP 1 
                                t1.A_Id + 1 as A_Id
                             FROM tbl_Project_Sch_Task_DT t1
                             LEFT JOIN tbl_Project_Sch_Task_DT t2 ON t1.A_Id + 1 = t2.A_Id
                             WHERE t2.A_Id IS NULL
                             ORDER BY t1.A_Id`,
                            { 
                                type: QueryTypes.SELECT,
                                transaction
                            }
                        );
                        nextAId = availableAIdResult[0]?.AvailableId || nextAId + 1;
                    }

                    await sequelize.query(
                        `INSERT INTO tbl_Project_Sch_Task_DT
                         (A_Id, Sch_Id, Task_Work_Date, Task_Start_Time, Task_End_Time)
                         VALUES (?, ?, ?, ?, ?)`,
                        {
                            replacements: [
                                nextAId,
                                finalSchId,
                                formatDateForSQL(date),
                                Sch_Est_Start_Time,
                                Sch_Est_End_Time
                            ],
                            type: QueryTypes.INSERT,
                            transaction
                        }
                    );
                    
                    nextAId++; // Increment for next record
                }
            }

            await transaction.commit();
            transaction = null;

            // Fetch and return created schedule
            const data = await sequelize.query<any>(
                `SELECT s.*, t.Task_Name, p.Plan_Type
                 FROM tbl_Project_Schedule s
                 LEFT JOIN tbl_Task t ON s.Task_Id = t.Task_Id
                 LEFT JOIN tbl_Sch_Plan p ON s.Sch_Plan_Id = p.Plan_Id
                 WHERE s.Sch_Id = ?`,
                { 
                    replacements: [finalSchId], 
                    type: QueryTypes.SELECT
                }
            );

            // Fetch the task dates
            const taskDates = await sequelize.query<any>(
                `SELECT * FROM tbl_Project_Sch_Task_DT WHERE Sch_Id = ?`,
                { 
                    replacements: [finalSchId], 
                    type: QueryTypes.SELECT
                }
            );

            // Fetch the plan details (if any)
            const planDt = await sequelize.query<any>(
                `SELECT * FROM tbl_Project_Sch_DT WHERE Sch_Id = ?`,
                { 
                    replacements: [finalSchId], 
                    type: QueryTypes.SELECT
                }
            );

            const responseData = {
                ...data[0],
                taskDates: taskDates,
                planDetails: planDt
            };

            return created(res, responseData, 'Project schedule created successfully');
            
        } catch (error) {
            console.error('Error during transaction operations:', error);
            
            if (transaction && !transaction.finished) {
                try {
                    await transaction.rollback();
                } catch (rollbackError) {
                    console.error('Error during transaction rollback:', rollbackError);
                }
            }
            throw error;
        }
        
    } catch (e) {
        console.error('Create Schedule Error:', e);
        
        if (transaction && !transaction.finished) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error('Error during final transaction rollback:', rollbackError);
            }
        }
        
        return res.status(500).json({
            success: false,
            message: 'Failed to create schedule',
            error: e instanceof Error ? e.message : 'Unknown error',
            stack: process.env.NODE_ENV === 'development' ? (e instanceof Error ? e.stack : undefined) : undefined
        });
    }
};


function getDatesBetween(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
}


function getDayOfWeek(date: Date): number {
    const day = date.getDay();
    return day === 0 ? 7 : day; 
}


function calculatePlanDetails(date: Date, planId: number): { week: number | null, month: number | null, day: number | null } {
    const dayOfWeek = getDayOfWeek(date);
    
    switch (planId) {
        case 2: 
            return {
                week: null,
                month: null,
                day: dayOfWeek
            };
            
        case 3: 
            return {
                week: getWeekOfMonth(date),
                month: null,
                day: dayOfWeek
            };
            
        case 4:
            return {
                week: getWeekOfMonth(date),
                month: date.getMonth() + 1,
                day: dayOfWeek
            };
            
        default: 
            return {
                week: null,
                month: null,
                day: null
            };
    }
}


function getWeekOfMonth(date: Date): number {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfMonth = date.getDate();
    const firstDayOfWeek = startOfMonth.getDay(); 
    

    const adjustedFirstDay = firstDayOfWeek === 0 ? 7 : firstDayOfWeek;
    
    return Math.ceil((dayOfMonth + adjustedFirstDay - 1) / 7);
}

export const updateSchedule = async (req: Request, res: Response) => {
    let transaction;
    
    try {
        const idCheck = validateWithZod<{ id: number }>(
            ScheduleIdSchema, 
            req.params
        );
        if (!idCheck.success) {
            return res.status(400).json({ 
                success: false, 
                errors: idCheck.errors 
            });
        }

        const bodyCheck = validateWithZod<ScheduleUpdate>(
            ScheduleUpdateSchema,
            req.body
        );
        if (!bodyCheck.success) {
            return res.status(400).json({ 
                success: false, 
                errors: bodyCheck.errors 
            });
        }

        const scheduleId = idCheck.data!.id;
        const updateData = bodyCheck.data!;

        const formatDateForSQL = (date: Date | string | null): string | null => {
            if (!date) return null;
            const d = date instanceof Date ? date : new Date(date);
            return d.toISOString().split('T')[0];
        };

        interface CheckResult {
            '': number;
        }

        interface MaxAIdResult {
            CurrentMaxAId: number;
            NextAId: number;
        }

       
        const exists = await sequelize.query(
            `SELECT 1 FROM tbl_Project_Schedule 
             WHERE Sch_Id = ? AND Sch_Del_Flag = 0`,
            { replacements: [scheduleId], type: 'SELECT' }
        ) as any[];

        if (!exists.length) {
            return notFound(res, 'Project schedule not found');
        }

       
        const dupCheck = await sequelize.query(
            `SELECT 1 FROM tbl_Project_Schedule 
             WHERE UPPER(Sch_No) = UPPER(?) AND Sch_Id != ? AND Sch_Del_Flag = 0`,
            { 
                replacements: [updateData.Sch_No, scheduleId], 
                type: 'SELECT' 
            }
        ) as any[];

        if (dupCheck.length) {
            return res.status(409).json({
                success: false,
                message: 'Schedule number already exists'
            });
        }

        const planTypeResult = await sequelize.query<{ Plan_Type: string }>(
            `SELECT Plan_Type FROM tbl_Sch_Plan WHERE Plan_Id = ?`,
            { 
                replacements: [updateData.Sch_Plan_Id], 
                type: QueryTypes.SELECT 
            }
        );

        const planType = planTypeResult[0]?.Plan_Type || '';

        transaction = await sequelize.transaction();

        try {
            const updateQuery = `
                UPDATE tbl_Project_Schedule 
                SET Sch_No = ?, Sch_Date = ?, Task_Id = ?, 
                    Sch_Type_Id = ?, Sch_Plan_Id = ?, 
                    Sch_Start_Date = ?, Sch_End_Date = ?,
                    Task_Sch_Timer_Based = ?, 
                    Sch_Est_Start_Time = ?, Sch_Est_End_Time = ?,
                    Task_Sch_Duaration = ?, Sch_Status = ?,
                    Update_By = ?, Update_Date = GETDATE()
                WHERE Sch_Id = ?
            `;

            await sequelize.query(updateQuery, {
                replacements: [
                    updateData.Sch_No,
                    formatDateForSQL(updateData.Sch_Date),
                    updateData.Task_Id,
                    updateData.Sch_Type_Id,
                    updateData.Sch_Plan_Id,
                    formatDateForSQL(updateData.Sch_Start_Date),
                    formatDateForSQL(updateData.Sch_End_Date),
                    updateData.Task_Sch_Timer_Based ? 1 : 0,
                    updateData.Sch_Est_Start_Time,
                    updateData.Sch_Est_End_Time,
                    updateData.Task_Sch_Duaration,
                    updateData.Sch_Status,
                    updateData.Update_By,
                    scheduleId
                ],
                transaction
            });

            await sequelize.query(
                `DELETE FROM tbl_Project_Sch_DT WHERE Sch_Id = ?`,
                { replacements: [scheduleId], transaction }
            );

            await sequelize.query(
                `DELETE FROM tbl_Project_Sch_Task_DT WHERE Sch_Id = ?`,
                { replacements: [scheduleId], transaction }
            );

            if (updateData.Sch_Start_Date && updateData.Sch_End_Date) {
                const startDate = new Date(updateData.Sch_Start_Date);
                const endDate = new Date(updateData.Sch_End_Date);
                
                const allDates = getDatesBetween(startDate, endDate);
                
                const datesToInsert = updateData.selectedDays && updateData.selectedDays.length > 0
                    ? allDates.filter(date => updateData.selectedDays!.includes(getDayOfWeek(date)))
                    : allDates;

                if (updateData.Sch_Plan_Id !== 1 && updateData.Sch_Plan_Id !== 5) { 
                    for (const date of datesToInsert) {
                        const planDetails = calculatePlanDetails(date, updateData.Sch_Plan_Id);
                        
                        await sequelize.query(
                            `INSERT INTO tbl_Project_Sch_DT
                             (Sch_Id, Plan_Week, Plan_Month, Plan_Day)
                             VALUES (?, ?, ?, ?)`,
                            {
                                replacements: [
                                    scheduleId,
                                    planDetails.week,
                                    planDetails.month,
                                    planDetails.day
                                ],
                                type: QueryTypes.INSERT,
                                transaction
                            }
                        );
                    }
                }

                const maxAIdResult = await sequelize.query<MaxAIdResult>(
                    `SELECT 
                        ISNULL(MAX(A_Id), 0) as CurrentMaxAId,
                        ISNULL(MAX(A_Id), 0) + 1 as NextAId 
                     FROM tbl_Project_Sch_Task_DT`,
                    { 
                        type: QueryTypes.SELECT,
                        transaction 
                    }
                );

                let nextAId = maxAIdResult[0]?.NextAId || 1;

                for (const date of datesToInsert) {
                    const aIdCheck = await sequelize.query<CheckResult>(
                        `SELECT 1 FROM tbl_Project_Sch_Task_DT WHERE A_Id = ?`,
                        { 
                            replacements: [nextAId], 
                            type: QueryTypes.SELECT,
                            transaction
                        }
                    );

                    if (aIdCheck.length > 0) {
                        const availableAIdResult = await sequelize.query<{ AvailableId: number }>(
                            `SELECT TOP 1 
                                t1.A_Id + 1 as A_Id
                             FROM tbl_Project_Sch_Task_DT t1
                             LEFT JOIN tbl_Project_Sch_Task_DT t2 ON t1.A_Id + 1 = t2.A_Id
                             WHERE t2.A_Id IS NULL
                             ORDER BY t1.A_Id`,
                            { 
                                type: QueryTypes.SELECT,
                                transaction
                            }
                        );
                        nextAId = availableAIdResult[0]?.AvailableId || nextAId + 1;
                    }

                    await sequelize.query(
                        `INSERT INTO tbl_Project_Sch_Task_DT
                         (A_Id, Sch_Id, Task_Work_Date, Task_Start_Time, Task_End_Time)
                         VALUES (?, ?, ?, ?, ?)`,
                        {
                            replacements: [
                                nextAId,
                                scheduleId,
                                formatDateForSQL(date),
                                updateData.Sch_Est_Start_Time,
                                updateData.Sch_Est_End_Time
                            ],
                            type: QueryTypes.INSERT,
                            transaction
                        }
                    );
                    
                    nextAId++; 
                }
            }

            await transaction.commit();
            
            transaction = null;

            const data = await sequelize.query<any>(
                `SELECT s.*, t.Task_Name, p.Plan_Type
                 FROM tbl_Project_Schedule s
                 LEFT JOIN tbl_Task t ON s.Task_Id = t.Task_Id
                 LEFT JOIN tbl_Sch_Plan p ON s.Sch_Plan_Id = p.Plan_Id
                 WHERE s.Sch_Id = ?`,
                { 
                    replacements: [scheduleId], 
                    type: QueryTypes.SELECT
                }
            );

            const taskDates = await sequelize.query<any>(
                `SELECT * FROM tbl_Project_Sch_Task_DT WHERE Sch_Id = ?`,
                { 
                    replacements: [scheduleId], 
                    type: QueryTypes.SELECT
                }
            );

   
            const planDt = await sequelize.query<any>(
                `SELECT * FROM tbl_Project_Sch_DT WHERE Sch_Id = ?`,
                { 
                    replacements: [scheduleId], 
                    type: QueryTypes.SELECT
                }
            );

            const responseData = {
                ...data[0],
                taskDates: taskDates,
                planDetails: planDt
            };

            return updated(res, responseData, 'Project schedule updated successfully');
            
        } catch (error) {
            console.error('Error during transaction operations:', error);
            

            if (transaction && !transaction.finished) {
                try {
                    await transaction.rollback();
                } catch (rollbackError) {
                    console.error('Error during transaction rollback:', rollbackError);
                }
            }
            

            throw error;
        }
        
    } catch (e) {
        console.error('Update Schedule Error:', e);
      
        return res.status(500).json({
            success: false,
            message: 'Failed to update schedule',
            error: e instanceof Error ? e.message : 'Unknown error',
            stack: process.env.NODE_ENV === 'development' ? (e instanceof Error ? e.stack : undefined) : undefined
        });
    }
};


export const updateScheduleStatus = async (req: Request, res: Response) => {
    try {
        const idCheck = validateWithZod<{ id: number }>(
            ScheduleIdSchema, 
            req.params
        );
        if (!idCheck.success) {
            return res.status(400).json({ 
                success: false, 
                errors: idCheck.errors 
            });
        }

        const bodyCheck = validateWithZod<ScheduleStatusUpdate>(
            ScheduleStatusUpdateSchema,
            req.body
        );
        if (!bodyCheck.success) {
            return res.status(400).json({ 
                success: false, 
                errors: bodyCheck.errors 
            });
        }

        const result = await sequelize.query(
            `UPDATE tbl_Project_Schedule 
             SET Sch_Status = ?, Update_By = ?, Update_Date = GETDATE()
             WHERE Sch_Id = ? AND Sch_Del_Flag = 0`,
            {
                replacements: [
                    bodyCheck.data!.status,
                    bodyCheck.data!.Update_By,
                    idCheck.data!.id
                ]
            }
        );

        if ((result as any).affectedRows === 0) {
            return notFound(res, 'Project schedule not found');
        }

        updated(res, null, 'Schedule status updated successfully');
    } catch (e) {
        servError(e, res);
    }
};

export const deleteSchedule = async (req: Request, res: Response) => {
    try {
        const validation = validateWithZod<{ id: number }>(
            ScheduleIdSchema,
            req.params
        );
        if (!validation.success) {
            return res.status(400).json({ 
                success: false, 
                errors: validation.errors 
            });
        }

        const result = await sequelize.query(
            `UPDATE tbl_Project_Schedule 
             SET Sch_Del_Flag = 1, Update_Date = GETDATE()
             WHERE Sch_Id = ? AND Sch_Del_Flag = 0`,
            { replacements: [validation.data!.id] }
        );

        if ((result as any).affectedRows === 0) {
            return notFound(res, 'Project schedule not found');
        }

        deleted(res, 'Project schedule deleted successfully');
    } catch (e) {
        servError(e, res);
    }
};

export const getSchedulePlansDropdown = async (req: Request, res: Response) => {
    try {
        const rows = await sequelize.query(
            `SELECT 
                Plan_Id as value,
                Plan_Type as label
             FROM tbl_Sch_Plan 
             ORDER BY Plan_Id`,
            { type: 'SELECT' }
        ) as any[];

        sentData(res, rows);
    } catch (e) {
        servError(e, res);
    }
};

export const getTasksDropdown = async (req: Request, res: Response) => {
    try {
        const rows = await sequelize.query(
            `SELECT 
                Task_Id as value,
                Task_Name as label
             FROM tbl_Task 
             WHERE Del_Flag = 0 OR Del_Flag IS NULL
             ORDER BY Task_Name`,
            { type: 'SELECT' }
        ) as any[];

        sentData(res, rows);
    } catch (e) {
        servError(e, res);
    }
};

export const getScheduleTypesDropdown = async (req: Request, res: Response) => {
    try {
        const rows = await sequelize.query(
            `SELECT DISTINCT
                Sch_Type_Id as value,
                CASE 
                    WHEN Sch_Type_Id = 0 THEN 'Regular'
                    WHEN Sch_Type_Id = 1 THEN 'Special'
                    ELSE 'Type ' + CAST(Sch_Type_Id AS VARCHAR)
                END as label
             FROM tbl_Project_Schedule 
             WHERE Sch_Type_Id IS NOT NULL
             GROUP BY Sch_Type_Id
             ORDER BY Sch_Type_Id`,
            { type: 'SELECT' }
        ) as any[];

        sentData(res, rows);
    } catch (e) {
        servError(e, res);
    }
};

export const getScheduleDropdown = async (req: Request, res: Response) => {
    try {
        const rows = await sequelize.query(
            `SELECT 
                s.Sch_Id as value,
                s.Sch_No + ' - ' + t.Task_Name as label
             FROM tbl_Project_Schedule s
             LEFT JOIN tbl_Task t ON s.Task_Id = t.Task_Id
             WHERE s.Sch_Del_Flag = 0
             ORDER BY s.Sch_No DESC`,
            { type: 'SELECT' }
        ) as any[];

        sentData(res, rows);
    } catch (e) {
        servError(e, res);
    }
};

export const getAllActiveSchedules = async (req: Request, res: Response) => {
    try {
        const rows = await sequelize.query(
            `SELECT s.*, t.Task_Name, p.Plan_Type
             FROM tbl_Project_Schedule s
             LEFT JOIN tbl_Task t ON s.Task_Id = t.Task_Id
             LEFT JOIN tbl_Sch_Plan p ON s.Sch_Plan_Id = p.Plan_Id
             WHERE s.Sch_Del_Flag = 0 AND s.Sch_Status = 1
             ORDER BY s.Sch_Date DESC`,
            { type: 'SELECT' }
        ) as any[];

        sentData(res, rows);
    } catch (e) {
        servError(e, res);
    }
};