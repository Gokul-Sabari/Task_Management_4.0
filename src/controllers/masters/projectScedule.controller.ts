// src/controllers/masters/projectManagement/projectSchedule.controller.ts
import { Request, Response } from 'express';
import {
    created,
    updated,
    deleted,
    servError,
    notFound,
    sentData
} from '../../responseObject';
import {
    ScheduleCreateSchema,
    ScheduleUpdateSchema,
    ScheduleQuerySchema,
    ScheduleIdSchema,
    ScheduleStatusUpdateSchema,
    ScheduleCreate,
    ScheduleUpdate,
    ScheduleQuery,
    ScheduleStatusUpdate
} from '../../models/masters/ProjectSchedule/schedule.type.model';
import { ZodError } from 'zod';
import { sequelize } from '../../config/sequalizer';
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

        let whereConditions = ['s.Sch_Del_Flag = 0'];
        const params: any[] = [];
        let paramCounter = 1;

        if (status !== undefined) {
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
            type: QueryTypes.SELECT
        }) as any[];

        const schedulesQuery = `
            SELECT 
                s.Sch_Id, s.Sch_No, s.Sch_Date, s.Task_Id, t.Task_Name,
                s.Sch_Type_Id, s.Sch_Plan_Id, p.Plan_Type,
                s.Sch_Start_Date, s.Sch_End_Date, s.Task_Sch_Timer_Based,
                s.Sch_Est_Start_Time, s.Sch_Est_End_Time, s.Task_Sch_Duaration,
                s.Sch_Status, s.Entry_By, s.Entry_Date, s.Update_By, s.Update_Date,
                pm.Project_Name,
                sd.Plan_Month, sd.Plan_Day
            FROM tbl_Project_Schedule s
            LEFT JOIN tbl_Task t ON s.Task_Id = t.Task_Id
            LEFT JOIN tbl_Project_Master pm ON t.Project_Id = pm.Project_Id
            LEFT JOIN tbl_Sch_Plan p ON s.Sch_Plan_Id = p.Plan_Id
            LEFT JOIN tbl_Project_Sch_DT sd ON s.Sch_Id = sd.Sch_Id
            ${whereClause}
        `;

        const schedules = await sequelize.query(schedulesQuery, {
            replacements: params.reduce((acc, val, idx) => {
                acc[`${idx + 1}`] = val;
                return acc;
            }, {}),
            type: QueryTypes.SELECT
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
            type: QueryTypes.SELECT
        }) as any[];

        const planDetailsQuery = `
            SELECT 
                Sch_Id,
                Plan_Month,
                Plan_Day
            FROM tbl_Project_Sch_DT 
            WHERE Sch_Id IN (${scheduleIds.map(() => '?').join(',')})
        `;

        const planDetails = await sequelize.query(planDetailsQuery, {
            replacements: scheduleIds,
            type: QueryTypes.SELECT
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
                    Task_Id: schedule.Task_Id,
                    Task_Name: schedule.Task_Name,
                    schTypeId: schedule.Sch_Type_Id,
                    schPlanId: schedule.Sch_Plan_Id,
                    Project_Name: schedule.Project_Name,
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
        console.error('Error in getAllSchedules:', e);
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
                sd.Plan_Month, sd.Plan_Day
            FROM tbl_Project_Schedule s
            LEFT JOIN tbl_Task t ON s.Task_Id = t.Task_Id
            LEFT JOIN tbl_Sch_Plan p ON s.Sch_Plan_Id = p.Plan_Id
            LEFT JOIN tbl_Project_Sch_DT sd ON s.Sch_Id = sd.Sch_Id
            WHERE s.Sch_Id = ? AND s.Sch_Del_Flag = 0
        `;

        const rows = await sequelize.query(query, {
            replacements: [validation.data!.id],
            type: QueryTypes.SELECT
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
            type: QueryTypes.SELECT
        }) as any[];

        const result = {
            schedule: rows[0],
            scheduleDetails: details,
            planDetails: {
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
            type: QueryTypes.SELECT
        }) as any[];

        sentData(res, rows);
    } catch (e) {
        servError(e, res);
    }
};

const formatDateForSQL = (date: Date | string | null): string | null => {
    if (!date) return null;
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().split('T')[0];
};

// FIXED: Date validation that properly allows same day (start date can equal end date)
const validateDateRange = (startDate: Date | string | null | undefined, endDate: Date | string | null | undefined): { valid: boolean; message?: string } => {
    // Skip validation if either date is missing
    if (!startDate || !endDate) {
        return { valid: true };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { 
            valid: false, 
            message: 'Invalid date format' 
        };
    }
    
    // Reset time part for date-only comparison
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    // FIXED: Allow same day (start <= end)
    // Only return error if end date is strictly before start date
    if (end < start) {
        return { 
            valid: false, 
            message: 'End date must be on or after start date' 
        };
    }
    
    return { valid: true };
};

export const createSchedule = async (req: Request, res: Response) => {
    let transaction;
    
    try {
        const body = {
            ...req.body,
            Sch_No: req.body.Sch_No?.trim(),
            Sch_Status: req.body.Sch_Status || 1
        };

        // Log the incoming request body for debugging
        console.log('Create Schedule Request Body:', JSON.stringify(body, null, 2));

        const validation = validateWithZod<ScheduleCreate>(
            ScheduleCreateSchema,
            body
        );

        if (!validation.success) {
            console.log('Validation Errors:', JSON.stringify(validation.errors, null, 2));
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
            Sch_Status, Entry_By, planDetails, selectedDays, specificDates 
        } = validation.data!;

        // FIXED: Use updated date validation that allows same day
        const dateValidation = validateDateRange(Sch_Start_Date, Sch_End_Date);
        if (!dateValidation.valid) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: [{
                    field: 'Sch_End_Date',
                    message: dateValidation.message
                }]
            });
        }

        // Log validation success
        console.log('Date validation passed for range:', Sch_Start_Date, 'to', Sch_End_Date);

        interface CheckResult {
            '': number;
        }

        interface MaxIdResult {
            CurrentMaxId: number;
            NextId: number;
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

        // Start transaction
        transaction = await sequelize.transaction();

        try {
            // Insert main schedule
            const insertValues = [
                finalSchId,  
                Sch_No,
                formatDateForSQL(Sch_Date || new Date()),
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

            // Handle plan details based on plan type
            if (Sch_Plan_Id !== 1 && Sch_Plan_Id !== 5 && selectedDays && selectedDays.length > 0) {
                if (Sch_Plan_Id === 2) { // Daily Based (Day of week)
                    for (const day of selectedDays) {
                        await sequelize.query(
                            `INSERT INTO tbl_Project_Sch_DT
                             (Sch_Id, Plan_Month, Plan_Day)
                             VALUES (?, ?, ?)`,
                            {
                                replacements: [
                                    finalSchId,
                                    null,
                                    day   
                                ],
                                type: QueryTypes.INSERT,
                                transaction
                            }
                        );
                    }
                } 
                else if (Sch_Plan_Id === 3) { // Weekly Based
                    for (const week of selectedDays) {
                        await sequelize.query(
                            `INSERT INTO tbl_Project_Sch_DT
                             (Sch_Id, Plan_Month, Plan_Day)
                             VALUES (?, ?, ?)`,
                            {
                                replacements: [
                                    finalSchId,
                                    planDetails?.Plan_Month || null,
                                    week
                                ],
                                type: QueryTypes.INSERT,
                                transaction
                            }
                        );
                    }
                }
                else if (Sch_Plan_Id === 4) { // Monthly Based
                    for (const day of selectedDays) {
                        await sequelize.query(
                            `INSERT INTO tbl_Project_Sch_DT
                             (Sch_Id, Plan_Month, Plan_Day)
                             VALUES (?, ?, ?)`,
                            {
                                replacements: [
                                    finalSchId,
                                    planDetails?.Plan_Month || null,
                                    day
                                ],
                                type: QueryTypes.INSERT,
                                transaction
                            }
                        );
                    }
                }
            }

            // Generate and insert task dates
            if (Sch_Start_Date && Sch_End_Date) {
                const startDate = new Date(Sch_Start_Date);
                const endDate = new Date(Sch_End_Date);
                
                // FIXED: generateTaskDates now properly handles same-day schedules
                const taskDates = generateTaskDates(
                    startDate, 
                    endDate, 
                    Sch_Plan_Id, 
                    selectedDays || [],
                    planDetails,
                    specificDates || []
                );

                console.log(`Generated ${taskDates.length} task dates for schedule`);

                for (const date of taskDates) {
                    const maxAIdResult = await sequelize.query<{ NextId: number }>(
                        `SELECT ISNULL(MAX(A_Id), 0) + 1 as NextId 
                         FROM tbl_Project_Sch_Task_DT`,
                        { 
                            type: QueryTypes.SELECT,
                            transaction 
                        }
                    );

                    let nextAId = maxAIdResult[0]?.NextId || 1;

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
                                finalSchId,
                                formatDateForSQL(date),
                                Sch_Est_Start_Time,
                                Sch_Est_End_Time
                            ],
                            type: QueryTypes.INSERT,
                            transaction
                        }
                    );
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
                    replacements: [finalSchId], 
                    type: QueryTypes.SELECT
                }
            );

            const taskDates = await sequelize.query<any>(
                `SELECT * FROM tbl_Project_Sch_Task_DT WHERE Sch_Id = ? ORDER BY Task_Work_Date`,
                { 
                    replacements: [finalSchId], 
                    type: QueryTypes.SELECT
                }
            );

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
    
    // FIXED: Use <= to include the end date when it's the same as start date
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

function getWeekOfMonth(date: Date): number {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const firstDayOfMonth = startOfMonth.getDay(); 
    const dayOfMonth = date.getDate();
    
    const adjustedFirstDay = firstDayOfMonth === 0 ? 7 : firstDayOfMonth;
    
    return Math.ceil((dayOfMonth + adjustedFirstDay - 1) / 7);
}

// FIXED: Ensure generateTaskDates properly handles same-day schedules
function generateTaskDates(
    startDate: Date, 
    endDate: Date, 
    planId: number, 
    selectedDays: number[],
    planDetails?: any,
    specificDates: string[] = []
): Date[] {
    const dates: Date[] = [];
    
    // For one-time schedule (planId 5), only include the start date
    if (planId === 5) {
        return [new Date(startDate)];
    }
    
    // For specific dates from calendar selection
    if (specificDates && specificDates.length > 0) {
        return specificDates.map(dateStr => new Date(dateStr));
    }
    
    const currentDate = new Date(startDate);
    
    // FIXED: Use <= to include the end date even when it's the same as start date
    while (currentDate <= endDate) {
        let includeDate = false;
        
        switch (planId) {
            case 1: // Special - all dates in range
                includeDate = true;
                break;
                
            case 2: // Daily Based (Day of week)
                const dayOfWeek = getDayOfWeek(currentDate);
                includeDate = selectedDays.includes(dayOfWeek);
                break;
                
            case 3: // Weekly Based
                const weekOfMonth = getWeekOfMonth(currentDate);
                includeDate = selectedDays.includes(weekOfMonth);
                break;
                
            case 4: // Monthly Based
                const dayOfMonth = currentDate.getDate();
                includeDate = selectedDays.includes(dayOfMonth);
                break;
                
            default:
                includeDate = true;
        }
        
        if (includeDate) {
            dates.push(new Date(currentDate));
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
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

        // FIXED: Use updated date validation that allows same day
        const dateValidation = validateDateRange(updateData.Sch_Start_Date, updateData.Sch_End_Date);
        if (!dateValidation.valid) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: [{
                    field: 'Sch_End_Date',
                    message: dateValidation.message
                }]
            });
        }

        interface CheckResult {
            '': number;
        }

        // Check if schedule exists
        const exists = await sequelize.query(
            `SELECT 1 FROM tbl_Project_Schedule 
             WHERE Sch_Id = ? AND Sch_Del_Flag = 0`,
            { replacements: [scheduleId], type: QueryTypes.SELECT }
        ) as any[];

        if (!exists.length) {
            return notFound(res, 'Project schedule not found');
        }

        // Duplicate check for Sch_No (if provided)
        if (updateData.Sch_No) {
            const dupCheck = await sequelize.query(
                `SELECT 1 FROM tbl_Project_Schedule 
                 WHERE UPPER(Sch_No) = UPPER(?) AND Sch_Id != ? AND Sch_Del_Flag = 0`,
                { 
                    replacements: [updateData.Sch_No, scheduleId], 
                    type: QueryTypes.SELECT 
                }
            ) as any[];

            if (dupCheck.length) {
                return res.status(409).json({
                    success: false,
                    message: 'Schedule number already exists'
                });
            }
        }

        transaction = await sequelize.transaction();

        try {
            // Build dynamic update query based on provided fields
            const updateFields: string[] = [];
            const updateValues: any[] = [];

            if (updateData.Sch_No !== undefined) {
                updateFields.push('Sch_No = ?');
                updateValues.push(updateData.Sch_No);
            }
            if (updateData.Sch_Date !== undefined) {
                updateFields.push('Sch_Date = ?');
                updateValues.push(formatDateForSQL(updateData.Sch_Date));
            }
            if (updateData.Task_Id !== undefined) {
                updateFields.push('Task_Id = ?');
                updateValues.push(updateData.Task_Id);
            }
            if (updateData.Sch_Type_Id !== undefined) {
                updateFields.push('Sch_Type_Id = ?');
                updateValues.push(updateData.Sch_Type_Id);
            }
            if (updateData.Sch_Plan_Id !== undefined) {
                updateFields.push('Sch_Plan_Id = ?');
                updateValues.push(updateData.Sch_Plan_Id);
            }
            if (updateData.Sch_Start_Date !== undefined) {
                updateFields.push('Sch_Start_Date = ?');
                updateValues.push(formatDateForSQL(updateData.Sch_Start_Date));
            }
            if (updateData.Sch_End_Date !== undefined) {
                updateFields.push('Sch_End_Date = ?');
                updateValues.push(formatDateForSQL(updateData.Sch_End_Date));
            }
            if (updateData.Task_Sch_Timer_Based !== undefined) {
                updateFields.push('Task_Sch_Timer_Based = ?');
                updateValues.push(updateData.Task_Sch_Timer_Based ? 1 : 0);
            }
            if (updateData.Sch_Est_Start_Time !== undefined) {
                updateFields.push('Sch_Est_Start_Time = ?');
                updateValues.push(updateData.Sch_Est_Start_Time);
            }
            if (updateData.Sch_Est_End_Time !== undefined) {
                updateFields.push('Sch_Est_End_Time = ?');
                updateValues.push(updateData.Sch_Est_End_Time);
            }
            if (updateData.Task_Sch_Duaration !== undefined) {
                updateFields.push('Task_Sch_Duaration = ?');
                updateValues.push(updateData.Task_Sch_Duaration);
            }
            if (updateData.Sch_Status !== undefined) {
                updateFields.push('Sch_Status = ?');
                updateValues.push(updateData.Sch_Status);
            }
            if (updateData.Update_By !== undefined) {
                updateFields.push('Update_By = ?');
                updateValues.push(updateData.Update_By);
            }

            // Always update Update_Date
            updateFields.push('Update_Date = GETDATE()');

            if (updateFields.length > 0) {
                const updateQuery = `
                    UPDATE tbl_Project_Schedule 
                    SET ${updateFields.join(', ')}
                    WHERE Sch_Id = ?
                `;

                updateValues.push(scheduleId);

                await sequelize.query(updateQuery, {
                    replacements: updateValues,
                    transaction
                });
            }

            // Delete existing plan details and task dates if we're updating the schedule plan or dates
            const shouldRegenerateDetails = 
                updateData.Sch_Plan_Id !== undefined || 
                updateData.Sch_Start_Date !== undefined || 
                updateData.Sch_End_Date !== undefined ||
                updateData.selectedDays !== undefined ||
                updateData.specificDates !== undefined;

            if (shouldRegenerateDetails) {
                await sequelize.query(
                    `DELETE FROM tbl_Project_Sch_DT WHERE Sch_Id = ?`,
                    { replacements: [scheduleId], transaction }
                );

                await sequelize.query(
                    `DELETE FROM tbl_Project_Sch_Task_DT WHERE Sch_Id = ?`,
                    { replacements: [scheduleId], transaction }
                );

                const planId = updateData.Sch_Plan_Id !== undefined ? updateData.Sch_Plan_Id : 
                               (await getCurrentPlanId(scheduleId));
                
                const startDate = updateData.Sch_Start_Date !== undefined ? updateData.Sch_Start_Date :
                                  (await getCurrentStartDate(scheduleId));
                const endDate = updateData.Sch_End_Date !== undefined ? updateData.Sch_End_Date :
                                (await getCurrentEndDate(scheduleId));
                const selectedDaysArray = updateData.selectedDays || [];
                const specificDatesArray = updateData.specificDates || [];

                if (startDate && endDate) {
                    const startDateObj = new Date(startDate);
                    const endDateObj = new Date(endDate);
                    
                    // FIXED: generateTaskDates now properly handles same-day schedules
                    const taskDates = generateTaskDates(
                        startDateObj, 
                        endDateObj, 
                        planId, 
                        selectedDaysArray,
                        updateData.planDetails,
                        specificDatesArray
                    );

                    // Insert plan details
                    if (planId !== 1 && planId !== 5 && selectedDaysArray.length > 0) {
                        if (planId === 2) {
                            for (const day of selectedDaysArray) {
                                await sequelize.query(
                                    `INSERT INTO tbl_Project_Sch_DT
                                     (Sch_Id, Plan_Month, Plan_Day)
                                     VALUES (?, ?, ?)`,
                                    {
                                        replacements: [
                                            scheduleId,
                                            null,
                                            day
                                        ],
                                        type: QueryTypes.INSERT,
                                        transaction
                                    }
                                );
                            }
                        } 
                        else if (planId === 3) {
                            for (const week of selectedDaysArray) {
                                await sequelize.query(
                                    `INSERT INTO tbl_Project_Sch_DT
                                     (Sch_Id, Plan_Month, Plan_Day)
                                     VALUES (?, ?, ?)`,
                                    {
                                        replacements: [
                                            scheduleId,
                                            updateData.planDetails?.Plan_Month || null,
                                            week
                                        ],
                                        type: QueryTypes.INSERT,
                                        transaction
                                    }
                                );
                            }
                        }
                        else if (planId === 4) {
                            for (const day of selectedDaysArray) {
                                await sequelize.query(
                                    `INSERT INTO tbl_Project_Sch_DT
                                     (Sch_Id, Plan_Month, Plan_Day)
                                     VALUES (?, ?, ?)`,
                                    {
                                        replacements: [
                                            scheduleId,
                                            updateData.planDetails?.Plan_Month || null,
                                            day
                                        ],
                                        type: QueryTypes.INSERT,
                                        transaction
                                    }
                                );
                            }
                        }
                    }

                    // Insert task dates
                    for (const date of taskDates) {
                        const maxAIdResult = await sequelize.query<{ NextId: number }>(
                            `SELECT ISNULL(MAX(A_Id), 0) + 1 as NextId 
                             FROM tbl_Project_Sch_Task_DT`,
                            { 
                                type: QueryTypes.SELECT,
                                transaction 
                            }
                        );

                        let nextAId = maxAIdResult[0]?.NextId || 1;

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

                        const estStartTime = updateData.Sch_Est_Start_Time !== undefined ? 
                                            updateData.Sch_Est_Start_Time : 
                                            await getCurrentEstStartTime(scheduleId);
                        const estEndTime = updateData.Sch_Est_End_Time !== undefined ? 
                                          updateData.Sch_Est_End_Time : 
                                          await getCurrentEstEndTime(scheduleId);

                        await sequelize.query(
                            `INSERT INTO tbl_Project_Sch_Task_DT
                             (A_Id, Sch_Id, Task_Work_Date, Task_Start_Time, Task_End_Time)
                             VALUES (?, ?, ?, ?, ?)`,
                            {
                                replacements: [
                                    nextAId,
                                    scheduleId,
                                    formatDateForSQL(date),
                                    estStartTime,
                                    estEndTime,
                                ],
                                type: QueryTypes.INSERT,
                                transaction
                            }
                        );
                    }
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
                `SELECT * FROM tbl_Project_Sch_Task_DT WHERE Sch_Id = ? ORDER BY Task_Work_Date`,
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

async function getCurrentPlanId(scheduleId: number): Promise<number> {
    const result = await sequelize.query(
        `SELECT Sch_Plan_Id FROM tbl_Project_Schedule WHERE Sch_Id = ?`,
        { replacements: [scheduleId], type: QueryTypes.SELECT }
    ) as any[];
    return result[0]?.Sch_Plan_Id || 1;
}

async function getCurrentStartDate(scheduleId: number): Promise<Date | null> {
    const result = await sequelize.query(
        `SELECT Sch_Start_Date FROM tbl_Project_Schedule WHERE Sch_Id = ?`,
        { replacements: [scheduleId], type: QueryTypes.SELECT }
    ) as any[];
    return result[0]?.Sch_Start_Date || null;
}

async function getCurrentEndDate(scheduleId: number): Promise<Date | null> {
    const result = await sequelize.query(
        `SELECT Sch_End_Date FROM tbl_Project_Schedule WHERE Sch_Id = ?`,
        { replacements: [scheduleId], type: QueryTypes.SELECT }
    ) as any[];
    return result[0]?.Sch_End_Date || null;
}

async function getCurrentEstStartTime(scheduleId: number): Promise<string | null> {
    const result = await sequelize.query(
        `SELECT Sch_Est_Start_Time FROM tbl_Project_Schedule WHERE Sch_Id = ?`,
        { replacements: [scheduleId], type: QueryTypes.SELECT }
    ) as any[];
    return result[0]?.Sch_Est_Start_Time || null;
}

async function getCurrentEstEndTime(scheduleId: number): Promise<string | null> {
    const result = await sequelize.query(
        `SELECT Sch_Est_End_Time FROM tbl_Project_Schedule WHERE Sch_Id = ?`,
        { replacements: [scheduleId], type: QueryTypes.SELECT }
    ) as any[];
    return result[0]?.Sch_Est_End_Time || null;
}

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
            { type: QueryTypes.SELECT }
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
            { type: QueryTypes.SELECT }
        ) as any[];

        sentData(res, rows);
    } catch (e) {
        servError(e, res);
    }
};

export const getScheduleTypesDropdown = async (req: Request, res: Response) => {
    try {
        // Return static list of all schedule types as per your CASE statement
        const scheduleTypes = [
            { value: 1, label: 'Special' },
            { value: 2, label: 'Day' },
            { value: 3, label: 'Week' },
            { value: 4, label: 'Month' }
        ];

        sentData(res, scheduleTypes);
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
            { type: QueryTypes.SELECT }
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
            { type: QueryTypes.SELECT }
        ) as any[];

        sentData(res, rows);
    } catch (e) {
        servError(e, res);
    }
};