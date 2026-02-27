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
    workMasterCreateSchema,
    workMasterUpdateSchema,
    workMasterIdSchema,
    WorkMasterCreateInput,
    WorkMasterUpdateInput
} from '../../../models/masters/workMaster/type.model';
import { ZodError } from 'zod';
import { sequelize } from '../../../config/sequalizer';

const validateWithZod = <T>(schema: any, data: any): {
    success: boolean;
    data?: T;
    errors?: Array<{ field: string; message: string }>
} => {
    try {
        const validatedData = schema.parse(data);
        return { success: true, data: validatedData };
    } catch (error: any) {
        if (error instanceof ZodError) {
            const zodIssues = error.issues || [];

            return {
                success: false,
                errors: zodIssues.map((err: any) => ({
                    field: err.path.join('.'),
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

const prepareWorkData = (data: any) => {
    const preparedData = { ...data };

    if (preparedData.Work_Dt && typeof preparedData.Work_Dt === 'string') {
        preparedData.Work_Dt = new Date(preparedData.Work_Dt);
    }

    if (preparedData.Start_Time && typeof preparedData.Start_Time === 'string') {
        preparedData.Start_Time = new Date(preparedData.Start_Time);
    }

    if (preparedData.End_Time && typeof preparedData.End_Time === 'string') {
        preparedData.End_Time = new Date(preparedData.End_Time);
    }

    return preparedData;
};

// ==================== GET ALL WORKS ====================
export const getAllWorks = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;
        
        const search = req.query.search as string || '';
        const empId = req.query.empId ? parseInt(req.query.empId as string) : undefined;
        const taskId = req.query.taskId ? parseInt(req.query.taskId as string) : undefined;
        const schId = req.query.schId ? parseInt(req.query.schId as string) : undefined;
        const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
        const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;
        const workStatus = req.query.workStatus as string || '';

        // Build WHERE conditions
        let whereConditions = ['1=1'];
        let replacements: any[] = [];

        if (empId) {
            whereConditions.push(`wm.Emp_Id = @p${replacements.length}`);
            replacements.push(empId);
        }

        if (taskId) {
            whereConditions.push(`wm.Task_Id = @p${replacements.length}`);
            replacements.push(taskId);
        }

        if (schId) {
            whereConditions.push(`wm.Sch_Id = @p${replacements.length}`);
            replacements.push(schId);
        }

        if (workStatus) {
            whereConditions.push(`wm.Work_Status = @p${replacements.length}`);
            replacements.push(workStatus);
        }

        if (fromDate) {
            whereConditions.push(`wm.Work_Dt >= @p${replacements.length}`);
            replacements.push(fromDate);
        }

        if (toDate) {
            whereConditions.push(`wm.Work_Dt <= @p${replacements.length}`);
            replacements.push(toDate);
        }

        if (search) {
            whereConditions.push(`(wm.Work_Done LIKE @p${replacements.length} OR wm.Work_Status LIKE @p${replacements.length + 1})`);
            replacements.push(`%${search}%`, `%${search}%`);
        }

        const whereClause = whereConditions.join(' AND ');

        // Get total count
        const countQuery = `
            SELECT COUNT(DISTINCT wm.SNo) as total
            FROM tbl_Work_Master wm
            WHERE ${whereClause}
        `;

        const countResult = await sequelize.query(countQuery, {
            replacements: replacements.reduce((acc, val, idx) => ({ ...acc, [`p${idx}`]: val }), {}),
            type: 'SELECT'
        });

        const total = (countResult as any)[0]?.total || 0;

        // Main query with pagination
        const query = `
            SELECT 
                wm.SNo,
                wm.Work_Id,
                wm.Sch_Id,
                wm.Task_Id,
                wm.Emp_Id,
                wm.Work_Dt,
                wm.Work_Done,
                wm.Start_Time,
                wm.End_Time,
                wm.Tot_Minutes,
                wm.Work_Status,
                wm.Entry_By,
                wm.Entry_Date,
                wm.Update_By,
                wm.Update_Date,
                wm.Process_Id,
                (
                    SELECT 
                        wp.WNo,
                        wp.Param_Id,
                        wp.Default_Value,
                        wp.Current_Value
                    FROM tbl_Work_Paramet_DT wp
                    WHERE wp.Work_Id = wm.Work_Id
                    FOR JSON PATH
                ) as parameters
            FROM tbl_Work_Master wm
            WHERE ${whereClause}
            ORDER BY wm.Work_Dt DESC, wm.SNo DESC
           
        `;

        const rows = await sequelize.query(query, {
            replacements: replacements.reduce((acc, val, idx) => ({ ...acc, [`p${idx}`]: val }), {}),
            type: 'SELECT'
        });

        // Parse the JSON parameters for each row
        const formattedRows = (rows as any[]).map(row => ({
            ...row,
            parameters: row.parameters ? JSON.parse(row.parameters) : []
        }));

        return res.status(200).json({
            success: true,
            data: {
                items: formattedRows,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (err) {
        console.error('Error fetching works:', err);
        servError(err, res);
    }
};


export const getWorkByWorkId = async (req: Request, res: Response) => {
    try {
        const validation = validateWithZod<{ id: number }>(
            workMasterIdSchema,
            req.params
        );

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID parameter',
                errors: validation.errors
            });
        }

        const { id } = validation.data!;

        const query = `
            SELECT 
                wm.SNo,
                wm.Work_Id,
                wm.Sch_Id,
                wm.Task_Id,
                wm.Emp_Id,
                wm.Work_Dt,
                wm.Work_Done,
                wm.Start_Time,
                wm.End_Time,
                wm.Tot_Minutes,
                wm.Work_Status,
                wm.Entry_By,
                wm.Entry_Date,
                wm.Update_By,
                wm.Update_Date,
                wm.Process_Id,
                (
                    SELECT 
                        wp.WNo,
                        wp.Param_Id,
                        wp.Default_Value,
                        wp.Current_Value
                    FROM tbl_Work_Paramet_DT wp
                    WHERE wp.Work_Id = wm.Work_Id
                    FOR JSON PATH
                ) as parameters
            FROM tbl_Work_Master wm
            WHERE wm.Work_Id = @id
        `;

        const result = await sequelize.query(query, {
            replacements: { id },
            type: 'SELECT'
        });

        if (!result || (result as any[]).length === 0) {
            return notFound(res, 'Work not found');
        }

        const row = (result as any[])[0];
        const formattedRow = {
            ...row,
            parameters: row.parameters ? JSON.parse(row.parameters) : []
        };

        return res.status(200).json({
            success: true,
            message: 'Work fetched successfully',
            data: formattedRow
        });

    } catch (e) {
        console.error('Error fetching work by ID:', e);
        servError(e, res);
    }
};

// ==================== CREATE WORK ====================
export const createWorkMaster = async (req: Request, res: Response) => {
    let transaction;
    
    try {
        // Start transaction
        transaction = await sequelize.transaction();

        // Check for duplicate Work_Id
        if (req.body.Work_Id) {
            const checkQuery = `SELECT Work_Id FROM tbl_Work_Master WHERE Work_Id = ?`;
            const existing = await sequelize.query(checkQuery, {
                replacements: [req.body.Work_Id],
                type: 'SELECT',
                transaction
            });

            if ((existing as any[]).length > 0) {
                await transaction.rollback();
                return res.status(409).json({
                    success: false,
                    message: 'Work with this ID already exists',
                    field: 'Work_Id'
                });
            }
        }

        // Prepare data with date conversions
        const preparedData = prepareWorkData(req.body);

        const validation = validateWithZod<WorkMasterCreateInput>(
            workMasterCreateSchema,
            preparedData
        );

        if (!validation.success) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        const { Parameters, ...workData } = validation.data!;

        // Map Work_Status string to integer
        let workStatusValue: number = 1; // Default to Pending
        if (workData.Work_Status) {
            switch(workData.Work_Status) {
                case 'Pending':
                    workStatusValue = 1;
                    break;
                case 'In Progress':
                    workStatusValue = 2;
                    break;
                case 'Completed':
                    workStatusValue = 3;
                    break;
                case 'Deleted':
                    workStatusValue = 4;
                    break;
                default:
                    workStatusValue = 1;
            }
        }

        // Insert Work Master - with Work_Status as integer
        const insertQuery = `
            INSERT INTO tbl_Work_Master (
                Work_Id, Sch_Id, Task_Id, Emp_Id, Work_Dt, Work_Done,
                Start_Time, End_Time, Tot_Minutes, Work_Status,
                Entry_By, Entry_Date, Process_Id
            ) 
            OUTPUT INSERTED.SNo
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE(), ?)
        `;

        const insertResult = await sequelize.query(insertQuery, {
            replacements: [
                workData.Work_Id,
                workData.Sch_Id,
                workData.Task_Id,
                workData.Emp_Id,
                workData.Work_Dt,
                workData.Work_Done || null,
                workData.Start_Time || null,
                workData.End_Time || null,
                workData.Tot_Minutes || null,
                workStatusValue, // Use integer value instead of string
                workData.Entry_By || null,
                workData.Process_Id || null
            ],
            transaction,
            type: 'SELECT'
        });

        // Create Parameters if provided
        if (Parameters && Parameters.length > 0) {
            for (const param of Parameters) {
                const paramInsertQuery = `
                    INSERT INTO tbl_Work_Paramet_DT (
                        Work_Id, Task_Id, Param_Id, Default_Value, Current_Value
                    ) VALUES (?, ?, ?, ?, ?)
                `;
                
                await sequelize.query(paramInsertQuery, {
                    replacements: [
                        workData.Work_Id,
                        workData.Task_Id,
                        param.Param_Id,
                        param.Default_Value || null,
                        param.Current_Value || null
                    ],
                    transaction
                });
            }
        }

        // Commit transaction
        await transaction.commit();

        // Fetch created work with parameters
        const selectQuery = `
            SELECT 
                wm.SNo,
                wm.Work_Id,
                wm.Sch_Id,
                wm.Task_Id,
                wm.Emp_Id,
                wm.Work_Dt,
                wm.Work_Done,
                wm.Start_Time,
                wm.End_Time,
                wm.Tot_Minutes,
                wm.Work_Status,
                wm.Entry_By,
                wm.Entry_Date,
                wm.Update_By,
                wm.Update_Date,
                wm.Process_Id,
                (
                    SELECT 
                        wp.WNo,
                        wp.Param_Id,
                        wp.Default_Value,
                        wp.Current_Value
                    FROM tbl_Work_Paramet_DT wp
                    WHERE wp.Work_Id = wm.Work_Id
                    FOR JSON PATH
                ) as parameters
            FROM tbl_Work_Master wm
            WHERE wm.Work_Id = ?
        `;

        const result = await sequelize.query(selectQuery, {
            replacements: [workData.Work_Id],
            type: 'SELECT'
        });

        const row = (result as any[])[0];
        
        // Convert Work_Status back to string for response
        const statusMap: { [key: number]: string } = {
            1: 'Pending',
            2: 'In Progress',
            3: 'Completed',
            4: 'Deleted'
        };

        const formattedRow = {
            ...row,
            Work_Status: statusMap[row.Work_Status] || 'Unknown',
            parameters: row.parameters ? JSON.parse(row.parameters) : []
        };

        return created(res, formattedRow, 'Work created successfully');

    } catch (error) {
        // Only rollback if transaction exists and hasn't been committed
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error('Error during rollback:', rollbackError);
            }
        }
        
        console.error('Error creating work:', error);
        return servError(error, res);
    }
};
// ==================== UPDATE WORK ====================
// UPDATE work
export const updateWorkMaster = async (req: Request, res: Response) => {
    let transaction;
    
    try {
        const idValidation = validateWithZod<{ id: number }>(workMasterIdSchema, req.params);
        if (!idValidation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID parameter',
                errors: idValidation.errors
            });
        }

        const { id } = idValidation.data!;
        
        // Start transaction
        transaction = await sequelize.transaction();

        // Check if work exists - using ? parameter
        const checkQuery = `SELECT * FROM tbl_Work_Master WHERE Work_Id = ?`;
        const existing = await sequelize.query(checkQuery, {
            replacements: [id], // Array with positional parameter
            type: 'SELECT',
            transaction
        });

        if ((existing as any[]).length === 0) {
            await transaction.rollback();
            return notFound(res, 'Work not found');
        }

        const existingWork = (existing as any[])[0];

        // Check for duplicate Work_Id if updating it - using ? parameters
        if (req.body.Work_Id && req.body.Work_Id !== existingWork.Work_Id) {
            const duplicateQuery = `SELECT Work_Id FROM tbl_Work_Master WHERE Work_Id = ? AND Work_Id != ?`;
            const duplicate = await sequelize.query(duplicateQuery, {
                replacements: [req.body.Work_Id, id], // Array with positional parameters
                type: 'SELECT',
                transaction
            });

            if ((duplicate as any[]).length > 0) {
                await transaction.rollback();
                return res.status(409).json({
                    success: false,
                    message: 'Another work with this ID already exists',
                    field: 'Work_Id'
                });
            }
        }

        const validation = validateWithZod<WorkMasterUpdateInput>(
            workMasterUpdateSchema,
            req.body
        );

        if (!validation.success) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        const { Parameters, ...updateData } = validation.data!;

        // Prepare update data with date conversions
        const preparedUpdateData = prepareWorkData(updateData);

        // Map Work_Status string to integer if present
        let workStatusValue: number | undefined = undefined;
        if (preparedUpdateData.Work_Status !== undefined) {
            switch(preparedUpdateData.Work_Status) {
                case 'Pending':
                    workStatusValue = 1;
                    break;
                case 'In Progress':
                    workStatusValue = 2;
                    break;
                case 'Completed':
                    workStatusValue = 3;
                    break;
                case 'Deleted':
                    workStatusValue = 4;
                    break;
                default:
                    workStatusValue = 1;
            }
        }

        // Build dynamic update query with ? parameters
        const setClauses: string[] = [];
        const replacements: any[] = [];

        if (preparedUpdateData.Work_Id !== undefined) {
            setClauses.push('Work_Id = ?');
            replacements.push(preparedUpdateData.Work_Id);
        }
        if (preparedUpdateData.Sch_Id !== undefined) {
            setClauses.push('Sch_Id = ?');
            replacements.push(preparedUpdateData.Sch_Id);
        }
        if (preparedUpdateData.Task_Id !== undefined) {
            setClauses.push('Task_Id = ?');
            replacements.push(preparedUpdateData.Task_Id);
        }
        if (preparedUpdateData.Emp_Id !== undefined) {
            setClauses.push('Emp_Id = ?');
            replacements.push(preparedUpdateData.Emp_Id);
        }
        if (preparedUpdateData.Work_Dt !== undefined) {
            setClauses.push('Work_Dt = ?');
            replacements.push(preparedUpdateData.Work_Dt);
        }
        if (preparedUpdateData.Work_Done !== undefined) {
            setClauses.push('Work_Done = ?');
            replacements.push(preparedUpdateData.Work_Done);
        }
        if (preparedUpdateData.Start_Time !== undefined) {
            setClauses.push('Start_Time = ?');
            replacements.push(preparedUpdateData.Start_Time);
        }
        if (preparedUpdateData.End_Time !== undefined) {
            setClauses.push('End_Time = ?');
            replacements.push(preparedUpdateData.End_Time);
        }
        if (preparedUpdateData.Tot_Minutes !== undefined) {
            setClauses.push('Tot_Minutes = ?');
            replacements.push(preparedUpdateData.Tot_Minutes);
        }
        if (workStatusValue !== undefined) {
            setClauses.push('Work_Status = ?');
            replacements.push(workStatusValue);
        }
        if (preparedUpdateData.Update_By !== undefined) {
            setClauses.push('Update_By = ?');
            replacements.push(preparedUpdateData.Update_By);
        }
        if (preparedUpdateData.Process_Id !== undefined) {
            setClauses.push('Process_Id = ?');
            replacements.push(preparedUpdateData.Process_Id);
        }

        setClauses.push('Update_Date = GETDATE()');

        if (setClauses.length > 0) {
            // Add the ID to the end of replacements for WHERE clause
            const allReplacements = [...replacements, id];
            
            const updateQuery = `
                UPDATE tbl_Work_Master 
                SET ${setClauses.join(', ')}
                WHERE Work_Id = ?
            `;
            
            await sequelize.query(updateQuery, {
                replacements: allReplacements,
                transaction
            });
        }

        // Update Parameters if provided
        if (Parameters) {
            // Delete existing parameters - using ? parameter
            await sequelize.query(`DELETE FROM tbl_Work_Paramet_DT WHERE Work_Id = ?`, {
                replacements: [id],
                transaction
            });

            // Create new parameters
            if (Parameters.length > 0) {
                for (const param of Parameters) {
                    const paramInsertQuery = `
                        INSERT INTO tbl_Work_Paramet_DT (
                            Work_Id, Task_Id, Param_Id, Default_Value, Current_Value
                        ) VALUES (?, ?, ?, ?, ?)
                    `;
                    
                    await sequelize.query(paramInsertQuery, {
                        replacements: [
                            id,
                            updateData.Task_Id || existingWork.Task_Id,
                            param.Param_Id,
                            param.Default_Value || null,
                            param.Current_Value || null
                        ],
                        transaction
                    });
                }
            }
        }

        await transaction.commit();

        // Fetch updated work with parameters - using ? parameter
        const selectQuery = `
            SELECT 
                wm.SNo,
                wm.Work_Id,
                wm.Sch_Id,
                wm.Task_Id,
                wm.Emp_Id,
                wm.Work_Dt,
                wm.Work_Done,
                wm.Start_Time,
                wm.End_Time,
                wm.Tot_Minutes,
                wm.Work_Status,
                wm.Entry_By,
                wm.Entry_Date,
                wm.Update_By,
                wm.Update_Date,
                wm.Process_Id,
                (
                    SELECT 
                        wp.WNo,
                        wp.Param_Id,
                        wp.Default_Value,
                        wp.Current_Value
                    FROM tbl_Work_Paramet_DT wp
                    WHERE wp.Work_Id = wm.Work_Id
                    FOR JSON PATH
                ) as parameters
            FROM tbl_Work_Master wm
            WHERE wm.Work_Id = ?
        `;

        const result = await sequelize.query(selectQuery, {
            replacements: [id],
            type: 'SELECT'
        });

        const row = (result as any[])[0];
        
        // Convert Work_Status back to string for response
        const statusMap: { [key: number]: string } = {
            1: 'Pending',
            2: 'In Progress',
            3: 'Completed',
            4: 'Deleted'
        };

        const formattedRow = {
            ...row,
            Work_Status: statusMap[row.Work_Status] || 'Unknown',
            parameters: row.parameters ? JSON.parse(row.parameters) : []
        };

        return updated(res, formattedRow, 'Work updated successfully');

    } catch (e) {
        // Only rollback if transaction exists
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error('Error during rollback:', rollbackError);
            }
        }
        
        console.error('Error updating work:', e);
        servError(e, res);
    }
};
// ==================== SOFT DELETE ====================
export const deleteWorkMaster = async (req: Request, res: Response) => {
    let transaction;
    
    try {
        const validation = validateWithZod<{ id: number }>(workMasterIdSchema, req.params);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID parameter',
                errors: validation.errors
            });
        }

        const { id } = validation.data!;
        const workId = id; // The id from params is the Work_Id
        
        // Start transaction
        transaction = await sequelize.transaction();

        // Check if work exists - using ? parameter
        const checkQuery = `SELECT Work_Id, Work_Status FROM tbl_Work_Master WHERE Work_Id = ?`;
        const existing = await sequelize.query(checkQuery, {
            replacements: [workId], // Array with positional parameter
            type: 'SELECT',
            transaction
        });

        if ((existing as any[]).length === 0) {
            await transaction.rollback();
            return notFound(res, 'Work not found');
        }

        const existingWork = (existing as any[])[0];

        // Check if already deleted (assuming Work_Status is integer)
        if (existingWork.Work_Status === 4) { // 4 = Deleted
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Work is already deleted'
            });
        }

        // Soft delete - update status to Deleted (4)
        const updateQuery = `
            UPDATE tbl_Work_Master 
            SET Work_Status = ?, Update_Date = GETDATE()
            WHERE Work_Id = ?
        `;

        await sequelize.query(updateQuery, {
            replacements: [4, workId], // 4 = Deleted, then workId
            transaction
        });

        await transaction.commit();
        return deleted(res, 'Work deleted successfully');

    } catch (e) {
        // Only rollback if transaction exists
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error('Error during rollback:', rollbackError);
            }
        }
        
        console.error('Error deleting work:', e);
        servError(e, res);
    }
};

// ==================== HARD DELETE ====================
export const hardDeleteWorkMaster = async (req: Request, res: Response) => {
    let transaction;
    
    try {
        const validation = validateWithZod<{ id: number }>(workMasterIdSchema, req.params);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Valid ID parameter is required',
                errors: validation.errors
            });
        }

        const { id } = validation.data!;
        const workId = id; // The id from params is the Work_Id
        
        // Start transaction
        transaction = await sequelize.transaction();

        // Check if work exists - using ? parameter
        const checkQuery = `SELECT Work_Id FROM tbl_Work_Master WHERE Work_Id = ?`;
        const existing = await sequelize.query(checkQuery, {
            replacements: [workId], // Array with positional parameter
            type: 'SELECT',
            transaction
        });

        if ((existing as any[]).length === 0) {
            await transaction.rollback();
            return notFound(res, 'Work not found');
        }

        // Delete parameters first (foreign key constraint) - using ? parameter
        await sequelize.query(`DELETE FROM tbl_Work_Paramet_DT WHERE Work_Id = ?`, {
            replacements: [workId], // Array with positional parameter
            transaction
        });

        // Delete work master - using ? parameter
        await sequelize.query(`DELETE FROM tbl_Work_Master WHERE Work_Id = ?`, {
            replacements: [workId], // Array with positional parameter
            transaction
        });

        await transaction.commit();

        return res.status(200).json({
            success: true,
            message: 'Work permanently deleted'
        });

    } catch (error) {
        // Only rollback if transaction exists
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error('Error during rollback:', rollbackError);
            }
        }
        
        console.error('Error hard deleting work:', error);
        servError(error as Error, res);
    }
};
// ==================== GET ACTIVE WORKS ====================
export const getActiveWorks = async (req: Request, res: Response) => {
    try {
        const { empId } = req.query;

        let whereClause = `wm.Work_Status != 'Deleted'`;
        let replacements: any = {};

        if (empId && !isNaN(Number(empId))) {
            whereClause += ` AND wm.Emp_Id = @empId`;
            replacements.empId = Number(empId);
        }

        const query = `
            SELECT 
                wm.SNo,
                wm.Work_Id,
                wm.Sch_Id,
                wm.Task_Id,
                wm.Emp_Id,
                wm.Work_Dt,
                wm.Work_Done,
                wm.Start_Time,
                wm.End_Time,
                wm.Tot_Minutes,
                wm.Work_Status,
                wm.Entry_By,
                wm.Entry_Date,
                wm.Update_By,
                wm.Update_Date,
                wm.Process_Id,
                (
                    SELECT 
                        wp.WNo,
                        wp.Param_Id,
                        wp.Default_Value,
                        wp.Current_Value
                    FROM tbl_Work_Paramet_DT wp
                    WHERE wp.Work_Id = wm.Work_Id
                    FOR JSON PATH
                ) as parameters
            FROM tbl_Work_Master wm
            WHERE ${whereClause}
            ORDER BY wm.Work_Dt DESC
        `;

        const rows = await sequelize.query(query, {
            replacements,
            type: 'SELECT'
        });

        const formattedRows = (rows as any[]).map(row => ({
            ...row,
            parameters: row.parameters ? JSON.parse(row.parameters) : []
        }));

        sentData(res, formattedRows);

    } catch (e) {
        console.error('Error fetching active works:', e);
        servError(e, res);
    }
};

// ==================== RESTORE WORK ====================
export const restoreWorkMaster = async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();

    try {
        const validation = validateWithZod<{ id: number }>(workMasterIdSchema, req.params);
        if (!validation.success) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Valid ID parameter is required',
                errors: validation.errors
            });
        }

        const { id } = validation.data!;

        // Check if deleted work exists
        const checkQuery = `SELECT * FROM tbl_Work_Master WHERE Work_Id = @id AND Work_Status = 'Deleted'`;
        const existing = await sequelize.query(checkQuery, {
            replacements: { id },
            type: 'SELECT',
            transaction
        });

        if ((existing as any[]).length === 0) {
            await transaction.rollback();
            return notFound(res, 'Deleted work not found');
        }

        // Restore work
        const updateQuery = `
            UPDATE tbl_Work_Master 
            SET Work_Status = 'Pending', Update_Date = GETDATE()
            WHERE Work_Id = @id
        `;

        await sequelize.query(updateQuery, {
            replacements: { id },
            transaction
        });

        await transaction.commit();

        // Fetch restored work
        const selectQuery = `
            SELECT 
                wm.SNo,
                wm.Work_Id,
                wm.Sch_Id,
                wm.Task_Id,
                wm.Emp_Id,
                wm.Work_Dt,
                wm.Work_Done,
                wm.Start_Time,
                wm.End_Time,
                wm.Tot_Minutes,
                wm.Work_Status,
                wm.Entry_By,
                wm.Entry_Date,
                wm.Update_By,
                wm.Update_Date,
                wm.Process_Id,
                (
                    SELECT 
                        wp.WNo,
                        wp.Param_Id,
                        wp.Default_Value,
                        wp.Current_Value
                    FROM tbl_Work_Paramet_DT wp
                    WHERE wp.Work_Id = wm.Work_Id
                    FOR JSON PATH
                ) as parameters
            FROM tbl_Work_Master wm
            WHERE wm.Work_Id = @id
        `;

        const result = await sequelize.query(selectQuery, {
            replacements: { id },
            type: 'SELECT'
        });

        const row = (result as any[])[0];
        const formattedRow = {
            ...row,
            parameters: row.parameters ? JSON.parse(row.parameters) : []
        };

        res.status(200).json({
            success: true,
            message: 'Work restored successfully',
            data: formattedRow
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Error restoring work:', error);
        servError(error as Error, res);
    }
};

// ==================== GET STATISTICS ====================
export const getWorkStatistics = async (req: Request, res: Response) => {
    try {
        const empId = req.query.empId ? parseInt(req.query.empId as string) : undefined;
        const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
        const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;

        let whereConditions = ['1=1'];
        let replacements: any = {};

        if (empId) {
            whereConditions.push(`Emp_Id = @empId`);
            replacements.empId = empId;
        }

        if (fromDate) {
            whereConditions.push(`Work_Dt >= @fromDate`);
            replacements.fromDate = fromDate;
        }

        if (toDate) {
            whereConditions.push(`Work_Dt <= @toDate`);
            replacements.toDate = toDate;
        }

        const whereClause = whereConditions.join(' AND ');

        const query = `
            SELECT 
                Work_Status,
                COUNT(SNo) as count,
                SUM(Tot_Minutes) as totalMinutes
            FROM tbl_Work_Master
            WHERE ${whereClause}
            GROUP BY Work_Status
        `;

        const stats = await sequelize.query(query, {
            replacements,
            type: 'SELECT'
        });

        sentData(res, stats);

    } catch (e) {
        console.error('Error getting statistics:', e);
        servError(e, res);
    }
};

// ==================== GET BY EMPLOYEE ID ====================
export const getWorksByEmployeeId = async (req: Request, res: Response) => {
    try {
        const { empId } = req.params;

        if (!empId || isNaN(Number(empId))) {
            return res.status(400).json({
                success: false,
                message: 'Valid Employee ID is required'
            });
        }

        const query = `
            SELECT 
                wm.SNo,
                wm.Work_Id,
                wm.Sch_Id,
                wm.Task_Id,
                wm.Emp_Id,
                wm.Work_Dt,
                wm.Work_Done,
                wm.Start_Time,
                wm.End_Time,
                wm.Tot_Minutes,
                wm.Work_Status,
                wm.Entry_By,
                wm.Entry_Date,
                wm.Update_By,
                wm.Update_Date,
                wm.Process_Id,
                (
                    SELECT 
                        wp.WNo,
                        wp.Param_Id,
                        wp.Default_Value,
                        wp.Current_Value
                    FROM tbl_Work_Paramet_DT wp
                    WHERE wp.Work_Id = wm.Work_Id
                    FOR JSON PATH
                ) as parameters
            FROM tbl_Work_Master wm
            WHERE wm.Emp_Id = @empId AND wm.Work_Status != 'Deleted'
            ORDER BY wm.Work_Dt DESC
        `;

        const rows = await sequelize.query(query, {
            replacements: { empId: Number(empId) },
            type: 'SELECT'
        });

        const formattedRows = (rows as any[]).map(row => ({
            ...row,
            parameters: row.parameters ? JSON.parse(row.parameters) : []
        }));

        sentData(res, formattedRows);

    } catch (e) {
        console.error('Error fetching works by employee:', e);
        servError(e, res);
    }
};

// ==================== GET BY TASK ID ====================
export const getWorksByTaskId = async (req: Request, res: Response) => {
    try {
        const { taskId } = req.params;

        if (!taskId || isNaN(Number(taskId))) {
            return res.status(400).json({
                success: false,
                message: 'Valid Task ID is required'
            });
        }

        const query = `
            SELECT 
                wm.SNo,
                wm.Work_Id,
                wm.Sch_Id,
                wm.Task_Id,
                wm.Emp_Id,
                wm.Work_Dt,
                wm.Work_Done,
                wm.Start_Time,
                wm.End_Time,
                wm.Tot_Minutes,
                wm.Work_Status,
                wm.Entry_By,
                wm.Entry_Date,
                wm.Update_By,
                wm.Update_Date,
                wm.Process_Id,
                (
                    SELECT 
                        wp.WNo,
                        wp.Param_Id,
                        wp.Default_Value,
                        wp.Current_Value
                    FROM tbl_Work_Paramet_DT wp
                    WHERE wp.Work_Id = wm.Work_Id
                    FOR JSON PATH
                ) as parameters
            FROM tbl_Work_Master wm
            WHERE wm.Task_Id = @taskId AND wm.Work_Status != 'Deleted'
            ORDER BY wm.Work_Dt DESC
        `;

        const rows = await sequelize.query(query, {
            replacements: { taskId: Number(taskId) },
            type: 'SELECT'
        });

        const formattedRows = (rows as any[]).map(row => ({
            ...row,
            parameters: row.parameters ? JSON.parse(row.parameters) : []
        }));

        sentData(res, formattedRows);

    } catch (e) {
        console.error('Error fetching works by task:', e);
        servError(e, res);
    }
};

// ==================== BULK CREATE ====================
export const bulkCreateWorkMaster = async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();

    try {
        const validation = validateWithZod<WorkMasterCreateInput[]>(
            workMasterCreateSchema.array(),
            req.body
        );

        if (!validation.success) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        const worksData = validation.data!;
        const workIds = worksData.map(w => w.Work_Id);

        // Check for existing Work_Ids
        const placeholders = workIds.map((_, i) => `@id${i}`).join(',');
        const checkQuery = `SELECT Work_Id FROM tbl_Work_Master WHERE Work_Id IN (${placeholders})`;
        
        const replacements: any = {};
        workIds.forEach((id, i) => {
            replacements[`id${i}`] = id;
        });

        const existing = await sequelize.query(checkQuery, {
            replacements,
            type: 'SELECT',
            transaction
        });

        if ((existing as any[]).length > 0) {
            await transaction.rollback();
            const existingIds = (existing as any[]).map(w => w.Work_Id);
            return res.status(409).json({
                success: false,
                message: `Work IDs already exist: ${existingIds.join(', ')}`
            });
        }

        const createdWorkIds = [];

        for (const data of worksData) {
            const { Parameters, ...workData } = data;

            // Insert Work Master
            const insertQuery = `
                INSERT INTO tbl_Work_Master (
                    Work_Id, Sch_Id, Task_Id, Emp_Id, Work_Dt, Work_Done,
                    Start_Time, End_Time, Tot_Minutes, Work_Status,
                    Entry_By, Entry_Date, Process_Id
                ) VALUES (
                    @workId, @schId, @taskId, @empId, @workDt, @workDone,
                    @startTime, @endTime, @totMinutes, @workStatus,
                    @entryBy, GETDATE(), @processId
                )
            `;

            await sequelize.query(insertQuery, {
                replacements: {
                    workId: workData.Work_Id,
                    schId: workData.Sch_Id,
                    taskId: workData.Task_Id,
                    empId: workData.Emp_Id,
                    workDt: workData.Work_Dt,
                    workDone: workData.Work_Done || null,
                    startTime: workData.Start_Time || null,
                    endTime: workData.End_Time || null,
                    totMinutes: workData.Tot_Minutes || null,
                    workStatus: workData.Work_Status || 'Pending',
                    entryBy: workData.Entry_By || null,
                    processId: workData.Process_Id || null
                },
                transaction
            });

            // Create Parameters if provided
            if (Parameters && Parameters.length > 0) {
                for (const param of Parameters) {
                    const paramInsertQuery = `
                        INSERT INTO tbl_Work_Paramet_DT (
                            Work_Id, Task_Id, Param_Id, Default_Value, Current_Value
                        ) VALUES (
                            @workId, @taskId, @paramId, @defaultValue, @currentValue
                        )
                    `;
                    
                    await sequelize.query(paramInsertQuery, {
                        replacements: {
                            workId: workData.Work_Id,
                            taskId: workData.Task_Id,
                            paramId: param.Param_Id,
                            defaultValue: param.Default_Value || null,
                            currentValue: param.Current_Value || null
                        },
                        transaction
                    });
                }
            }

            // createdWorkIds.push(workData.Work_Id);
        }

        await transaction.commit();

        // Fetch all created works
        const selectPlaceholders = createdWorkIds.map((_, i) => `@id${i}`).join(',');
        const selectReplacements: any = {};
        createdWorkIds.forEach((id, i) => {
            selectReplacements[`id${i}`] = id;
        });

        const selectQuery = `
            SELECT 
                wm.SNo,
                wm.Work_Id,
                wm.Sch_Id,
                wm.Task_Id,
                wm.Emp_Id,
                wm.Work_Dt,
                wm.Work_Done,
                wm.Start_Time,
                wm.End_Time,
                wm.Tot_Minutes,
                wm.Work_Status,
                wm.Entry_By,
                wm.Entry_Date,
                wm.Update_By,
                wm.Update_Date,
                wm.Process_Id,
                (
                    SELECT 
                        wp.WNo,
                        wp.Param_Id,
                        wp.Default_Value,
                        wp.Current_Value
                    FROM tbl_Work_Paramet_DT wp
                    WHERE wp.Work_Id = wm.Work_Id
                    FOR JSON PATH
                ) as parameters
            FROM tbl_Work_Master wm
            WHERE wm.Work_Id IN (${selectPlaceholders})
            ORDER BY wm.Work_Dt DESC
        `;

        const results = await sequelize.query(selectQuery, {
            replacements: selectReplacements,
            type: 'SELECT'
        });

        const formattedRows = (results as any[]).map(row => ({
            ...row,
            parameters: row.parameters ? JSON.parse(row.parameters) : []
        }));

        return res.status(201).json({
            success: true,
            message: `${formattedRows.length} works created successfully`,
            data: formattedRows
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Error bulk creating works:', error);
        servError(error as Error, res);
    }
};