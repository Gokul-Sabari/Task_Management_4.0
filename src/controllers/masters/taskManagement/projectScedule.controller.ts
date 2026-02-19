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
            page = 1, 
            limit = 20, 
            search, 
            status,
            planType,
            taskId,
            dateFrom,
            dateTo,
            sortBy = 'Sch_Id', 
            sortOrder = 'DESC' 
        } = validation.data!;

        const validSortFields = ['Sch_Id', 'Sch_No', 'Sch_Date', 'Task_Name', 'Sch_Status', 'Entry_Date'];
        
        if (!validSortFields.includes(sortBy)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid sort field' 
            });
        }

        let whereConditions = ['s.Sch_Del_Flag = 0'];
        const params: any[] = [];
        let paramCounter = 1;

        if (search) {
            whereConditions.push(`(s.Sch_No LIKE @${paramCounter} OR t.Task_Name LIKE @${paramCounter})`);
            params.push(`%${search}%`);
            paramCounter++;
        }

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

     

        const dataQuery = `
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
            ORDER BY ${sortBy} ${sortOrder}
        `;

        const rows = await sequelize.query(dataQuery, {
            replacements: params.reduce((acc, val, idx) => {
                acc[`${idx + 1}`] = val;
                return acc;
            }, {}),
            type: 'SELECT'
        }) as any[];

    

        res.status(200).json({
            success: true,
            message: 'Project schedules retrieved successfully',
            data: rows,
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

        console.log('Received body:', body);

        const validation = validateWithZod<ScheduleCreate>(
            ScheduleCreateSchema,
            body
        );

        if (!validation.success) {
            console.log('Validation failed:', validation.errors);
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
            Sch_Status, Entry_By, planDetails 
        } = validation.data!;

        console.log('Validated data:', {
            Sch_No, Sch_Date, Task_Id, Sch_Type_Id, Sch_Plan_Id,
            Sch_Start_Date, Sch_End_Date, Task_Sch_Timer_Based,
            Sch_Est_Start_Time, Sch_Est_End_Time, Task_Sch_Duaration,
            Sch_Status, Entry_By, planDetails
        });

        // Helper function to format date for SQL Server
        const formatDateForSQL = (date: Date | string | null): string | null => {
            if (!date) return null;
            
            const d = date instanceof Date ? date : new Date(date);
            // Format as YYYY-MM-DD for SQL Server
            return d.toISOString().split('T')[0];
        };

        interface CheckResult {
            '': number;
        }

        interface MaxIdResult {
            CurrentMaxId: number;
            NextId: number;
        }

        // Check for duplicate schedule number
        console.log('Checking for duplicate schedule number:', Sch_No);
        const dupCheck = await sequelize.query<CheckResult>(
            `SELECT 1 FROM tbl_Project_Schedule 
             WHERE UPPER(Sch_No) = UPPER(?) AND Sch_Del_Flag = 0`,
            { 
                replacements: [Sch_No], 
                type: QueryTypes.SELECT 
            }
        );

        if (dupCheck.length) {
            console.log('Duplicate found');
            return res.status(409).json({
                success: false,
                message: 'Schedule number already exists'
            });
        }
        console.log('No duplicate found');

        // Get the next Sch_Id by finding max + 1
        console.log('Getting next Sch_Id...');
        const maxIdResult = await sequelize.query<MaxIdResult>(
            `SELECT 
                ISNULL(MAX(Sch_Id), 0) as CurrentMaxId,
                ISNULL(MAX(Sch_Id), 0) + 1 as NextId 
             FROM tbl_Project_Schedule`,
            { 
                type: QueryTypes.SELECT 
            }
        );

        const currentMaxId = maxIdResult[0]?.CurrentMaxId || 0;
        const nextSchId = maxIdResult[0]?.NextId;
        
        if (!nextSchId) {
            throw new Error('Failed to generate next Schedule ID');
        }

        console.log('Current Max Sch_Id:', currentMaxId);
        console.log('Next Sch_Id:', nextSchId);

        // Verify that the next ID is indeed available
        const idCheck = await sequelize.query<CheckResult>(
            `SELECT 1 FROM tbl_Project_Schedule WHERE Sch_Id = ?`,
            { 
                replacements: [nextSchId], 
                type: QueryTypes.SELECT 
            }
        );

        if (idCheck.length > 0) {
            // If ID already exists (shouldn't happen, but just in case)
            console.log('Warning: Generated ID already exists, trying next available...');
            
            // Find the first available ID
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

            const availableId = availableIdResult[0]?.AvailableId || nextSchId + 1;
    
            
            // Use the available ID instead
            const finalSchId = availableId;
            
            // Continue with the available ID
            await insertScheduleWithId(finalSchId);
        } else {
            // Use the generated next ID
            await insertScheduleWithId(nextSchId);
        }

        // Helper function to insert with a specific ID
        async function insertScheduleWithId(schId: number) {
            // Start transaction
            console.log('Starting transaction...');
            transaction = await sequelize.transaction();
            console.log('Transaction started');

            try {
                // Prepare values for insert including the generated Sch_Id
                const insertValues = [
                    schId,  // Add Sch_Id as the first parameter
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

                console.log('Insert values:', insertValues);

                // Insert with explicit Sch_Id
                const insertQuery = `
                    INSERT INTO tbl_Project_Schedule
                    (Sch_Id, Sch_No, Sch_Date, Task_Id, Sch_Type_Id, Sch_Plan_Id,
                     Sch_Start_Date, Sch_End_Date, Task_Sch_Timer_Based,
                     Sch_Est_Start_Time, Sch_Est_End_Time, Task_Sch_Duaration,
                     Sch_Status, Entry_By, Entry_Date, Sch_Del_Flag)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE(), 0)
                `;

                console.log('Executing insert query...');
                await sequelize.query(insertQuery, {
                    replacements: insertValues,
                    type: QueryTypes.INSERT,
                    transaction
                });

                console.log('Insert successful with ID:', schId);

                // Insert plan details if provided
                if (planDetails && (planDetails.Plan_Week || planDetails.Plan_Month || planDetails.Plan_Day)) {
                    console.log('Inserting plan details:', planDetails);
                    await sequelize.query(
                        `INSERT INTO tbl_Project_Sch_DT
                         (Sch_Id, Plan_Week, Plan_Month, Plan_Day)
                         VALUES (?, ?, ?, ?)`,
                        {
                            replacements: [
                                schId,
                                planDetails.Plan_Week || null,
                                planDetails.Plan_Month || null,
                                planDetails.Plan_Day || null
                            ],
                            type: QueryTypes.INSERT,
                            transaction
                        }
                    );
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
                        replacements: [schId], 
                        type: QueryTypes.SELECT
                    }
                );

                return created(res, data[0], 'Project schedule created successfully');
                
            } catch (error) {
                console.error('Error during transaction operations:', error);
                
            
                if (transaction && !transaction.finished) {
                    try {
                        console.log('Rolling back transaction...');
                        await transaction.rollback();
                        console.log('Transaction rolled back');
                    } catch (rollbackError) {
                        console.error('Error during transaction rollback:', rollbackError);
                    }
                }
                throw error;
            }
        }
        
    } catch (e) {
        console.error('Create Schedule Error:', e);
        

        if (transaction && !transaction.finished) {
            try {
                console.log('Final rollback attempt...');
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



export const updateSchedule = async (req: Request, res: Response) => {
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

        // Check if schedule exists
        const exists = await sequelize.query(
            `SELECT 1 FROM tbl_Project_Schedule 
             WHERE Sch_Id = ? AND Sch_Del_Flag = 0`,
            { replacements: [idCheck.data!.id], type: 'SELECT' }
        ) as any[];

        if (!exists.length) {
            return notFound(res, 'Project schedule not found');
        }

        const dupCheck = await sequelize.query(
            `SELECT 1 FROM tbl_Project_Schedule 
             WHERE UPPER(Sch_No) = UPPER(?) AND Sch_Id != ? AND Sch_Del_Flag = 0`,
            { 
                replacements: [bodyCheck.data!.Sch_No, idCheck.data!.id], 
                type: 'SELECT' 
            }
        ) as any[];

        if (dupCheck.length) {
            return res.status(409).json({
                success: false,
                message: 'Schedule number already exists'
            });
        }

        const transaction = await sequelize.transaction();

        try {
            // Update main schedule
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
                    bodyCheck.data!.Sch_No,
                    bodyCheck.data!.Sch_Date,
                    bodyCheck.data!.Task_Id,
                    bodyCheck.data!.Sch_Type_Id,
                    bodyCheck.data!.Sch_Plan_Id,
                    bodyCheck.data!.Sch_Start_Date,
                    bodyCheck.data!.Sch_End_Date,
                    bodyCheck.data!.Task_Sch_Timer_Based,
                    bodyCheck.data!.Sch_Est_Start_Time,
                    bodyCheck.data!.Sch_Est_End_Time,
                    bodyCheck.data!.Task_Sch_Duaration,
                    bodyCheck.data!.Sch_Status,
                    bodyCheck.data!.Update_By,
                    idCheck.data!.id
                ],
                transaction
            });

            // Update plan details if provided
            if (bodyCheck.data!.planDetails) {
                // Delete existing plan details
                await sequelize.query(
                    `DELETE FROM tbl_Project_Sch_DT WHERE Sch_Id = ?`,
                    { replacements: [idCheck.data!.id], transaction }
                );

                // Insert new plan details
                await sequelize.query(
                    `INSERT INTO tbl_Project_Sch_DT
                     (Sch_Id, Plan_Week, Plan_Month, Plan_Day)
                     VALUES (?, ?, ?, ?)`,
                    {
                        replacements: [
                            idCheck.data!.id,
                            bodyCheck.data!.planDetails.Plan_Week || null,
                            bodyCheck.data!.planDetails.Plan_Month || null,
                            bodyCheck.data!.planDetails.Plan_Day || null
                        ],
                        transaction
                    }
                );
            }

            await transaction.commit();

            updated(res, null, 'Project schedule updated successfully');
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (e) {
        servError(e, res);
    }
};

/* -------------------- UPDATE SCHEDULE STATUS -------------------- */
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

/* -------------------- DELETE SCHEDULE (SOFT DELETE) -------------------- */
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

/* -------------------- DROPDOWN: SCHEDULE PLANS -------------------- */
export const getSchedulePlansDropdown = async (_: Request, res: Response) => {
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

/* -------------------- DROPDOWN: TASKS -------------------- */
export const getTasksDropdown = async (_: Request, res: Response) => {
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

/* -------------------- DROPDOWN: SCHEDULE TYPES -------------------- */
export const getScheduleTypesDropdown = async (_: Request, res: Response) => {
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

/* -------------------- DROPDOWN: SCHEDULES -------------------- */
export const getScheduleDropdown = async (_: Request, res: Response) => {
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

/* -------------------- GET ALL ACTIVE SCHEDULES (SIMPLE LIST) -------------------- */
export const getAllActiveSchedules = async (_: Request, res: Response) => {
    try {
        const rows = await sequelize.query(
            `SELECT s.*, t.Task_Name, p.Plan_Type
             FROM tbl_Project_Schedule s
             LEFT JOIN tbl_Task t ON s.Task_Id = t.Task_Id
             LEFT JOIN tbl_Sch_Plan p ON s.Sch_Plan_Id = p.Plan_Id
             WHERE s.Sch_Del_Flag = 0 AND s.Sch_Status = 'Active'
             ORDER BY s.Sch_Date DESC`,
            { type: 'SELECT' }
        ) as any[];

        sentData(res, rows);
    } catch (e) {
        servError(e, res);
    }
};