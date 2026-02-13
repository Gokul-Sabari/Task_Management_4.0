import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { ZodError } from 'zod';
import {
    created,
    updated,
    deleted,
    servError,
    notFound,
    sentData
} from '../../../responseObject';
import { Task } from '../../../models/masters/task/type.model'
import {
    taskCreateSchema,
    taskUpdateSchema,
    taskQuerySchema,
    taskIdSchema,
    TaskCreateInput,
    TaskUpdateInput,
    TaskQueryParams
} from  '../../../models/masters/task/type.model';

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
            const zodIssues = error.issues || (error as any).errors || [];

            return {
                success: false,
                errors: zodIssues.map((err: any) => ({
                    field: Array.isArray(err.path) ? err.path.join('.') : String(err.path || 'unknown'),
                    message: err.message || 'Validation error'
                }))
            };
        }
        return {
            success: false,
            errors: [{ field: 'unknown', message: 'Validation failed' }]
        };
    }
};

/**
 * Get all tasks with pagination and filtering
 */
export const getAllTasks = async (req: Request, res: Response) => {
    try {
        // Validate query parameters
        const validation = validateWithZod<TaskQueryParams>(taskQuerySchema, req.query);
        
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        const {
        
           Company_Id,
            Task_Type_Id,
            Project_Id,
            search,
            sortBy = 'Task_Id',
            sortOrder = 'DESC'
        } = validation.data!;

        // const pageNum = Math.max(1, page);
        // const limitNum = Math.min(Math.max(1, limit), 100);
        // const offset = (pageNum - 1) * limitNum;

        // Build where clause
        const whereClause: any = {};
        
        if (Company_Id !== undefined && Company_Id !== null) whereClause.Company_Id = Company_Id;
        if (Task_Type_Id !== undefined) whereClause.Task_Type_Id = Task_Type_Id;
        if (Project_Id !== undefined && Project_Id !== null) whereClause.Project_Id = Project_Id;
        
        // Search functionality
        if (search) {
            whereClause[Op.or] = [
                { Task_Name: { [Op.like]: `%${search}%` } },
                { Task_Desc: { [Op.like]: `%${search}%` } }
            ];
        }

        // Validate sort parameters
        const validSortFields = ['Task_Id', 'Task_Name', 'Entry_Date', 'Update_Date'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'Task_Id';
        const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const { count, rows: tasks } = await Task.findAndCountAll({
            where: whereClause,
            // limit: limitNum,
            // offset: offset,
            order: [[sortField, sortDirection]]
        });

     return res.status(200).json({
            success: true,
            message: 'Tasks retrieved successfully',
            data: tasks,
            metadata: {
                totalRecords: count,
                // currentPage: pageNum,
                // totalPages: Math.ceil(count / limitNum),
                // pageSize: limitNum,
                // hasNextPage: pageNum < Math.ceil(count / limitNum),
                // hasPreviousPage: pageNum > 1
            }
        });

    } catch (error: any) {
        console.error('Error fetching tasks:', error);
        return servError(res, error.message || 'Internal server error');
    }
};

/**
 * Get task by ID
 */
export const getTaskById = async (req: Request, res: Response) => {
    try {
        // Validate ID parameter
        const validation = validateWithZod<{ id: number }>(taskIdSchema, { id: parseInt(req.params.id) });
        
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        const { id } = validation.data!;

        const task = await Task.findByPk(id);
        
        if (!task) {
            return notFound(res, 'Task not found');
        }

         return res.status(200).json({
            success: true,
            message: 'Task retrieved successfully',
            data: task
        });

    } catch (error: any) {
        console.error('Error fetching task:', error);
        return servError(res, error.message || 'Internal server error');
    }
};

/**
 * Get tasks by project ID
 */
export const getTasksByProject = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        
        if (!projectId || isNaN(parseInt(projectId))) {
            return res.status(400).json({
                success: false,
                message: 'Valid project ID is required'
            });
        }

        const tasks = await Task.findAll({
            where: { Project_Id: parseInt(projectId) },
            order: [['Task_Name', 'ASC']]
        });

        if (tasks.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No tasks found for this project',
                data: []
            });
        }

         return res.status(200).json({
            success: true,
            message: 'Tasks retrieved successfully',
            data: tasks
        });

    } catch (error: any) {
        console.error('Error fetching tasks by project:', error);
        return servError(res, error.message || 'Internal server error');
    }
};

/**
 * Get tasks by company ID
 */
export const getTasksByCompany = async (req: Request, res: Response) => {
    try {
        const { companyId } = req.params;
        
        if (!companyId || isNaN(parseInt(companyId))) {
            return res.status(400).json({
                success: false,
                message: 'Valid company ID is required'
            });
        }

        const tasks = await Task.findAll({
            where: { Company_Id: parseInt(companyId) },
            order: [['Task_Name', 'ASC']]
        });

        if (tasks.length === 0) {
             return res.status(200).json({
                success: true,
                message: 'No tasks found for this company',
                data: []
            });
        }
   return res.status(200).json({
            success: true,
            message: 'Tasks retrieved successfully',
            data: tasks
        });

    } catch (error: any) {
        console.error('Error fetching tasks by company:', error);
        return servError(res, error.message || 'Internal server error');
    }
};

/**
 * Get tasks by task group ID
 */
export const getTasksByTaskGroup = async (req: Request, res: Response) => {
    try {
        const { taskGroupId } = req.params;
        
        if (!taskGroupId || isNaN(parseInt(taskGroupId))) {
            return res.status(400).json({
                success: false,
                message: 'Valid task group ID is required'
            });
        }

        const tasks = await Task.findAll({
            where: { Task_Type_Id: parseInt(taskGroupId) },
            order: [['Task_Name', 'ASC']]
        });

        if (tasks.length === 0) {
               return res.status(200).json({
                success: true,
                message: 'No tasks found for this task group',
                data: []
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Tasks retrieved successfully',
            data: tasks
        });

    } catch (error: any) {
        console.error('Error fetching tasks by task group:', error);
        return servError(res, error.message || 'Internal server error');
    }
};

/**
 * Create new task
 */
export const createTask = async (req: Request, res: Response) => {
    try {
        // Validate request body
        const validation = validateWithZod<TaskCreateInput>(taskCreateSchema, req.body);
        
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        const taskData = validation.data!;

        // Check for duplicate task name in same group
        const existingTask = await Task.findOne({
            where: {
                Task_Name: taskData.Task_Name.trim(),
                Task_Type_Id: taskData.Task_Type_Id
            }
        });

        if (existingTask) {
            return res.status(409).json({
                success: false,
                message: 'Task with this name already exists in the selected group'
            });
        }

        // Prepare task data with additional fields
        const finalTaskData: any = {
            ...taskData,
            Task_Name: taskData.Task_Name.trim(),
            Task_Desc: taskData.Task_Desc ? taskData.Task_Desc.trim() : null,
            Company_Id: taskData.Company_Id || null,
            Project_Id: taskData.Project_Id || null,
            Entry_By: (req as any).user?.id || 1,
            Entry_Date: new Date()
        };

        const task = await Task.create(finalTaskData);
        
        return created(res, {
            success: true,
            message: 'Task created successfully',
            data: task
        });

    } catch (error: any) {
        console.error('Error creating task:', error);
        return servError(res, error.message || 'Internal server error');
    }
};

/**
 * Update task
 */
export const updateTask = async (req: Request, res: Response) => {
    try {
        // Validate ID parameter
        const idValidation = validateWithZod<{ id: number }>(taskIdSchema, { id: parseInt(req.params.id) });
        
        if (!idValidation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: idValidation.errors
            });
        }

        const { id } = idValidation.data!;

        // Validate request body
        const bodyValidation = validateWithZod<TaskUpdateInput>(taskUpdateSchema, req.body);
        
        if (!bodyValidation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: bodyValidation.errors
            });
        }

        const updateData = bodyValidation.data!;

        const task = await Task.findByPk(id);
        
        if (!task) {
            return notFound(res, 'Task not found');
        }

        // Check for duplicate task name if Task_Name or Task_Type_Id is being updated
        if ((updateData.Task_Name && updateData.Task_Name !== task.Task_Name) || 
            (updateData.Task_Type_Id && updateData.Task_Type_Id !== task.Task_Type_Id)) {
            
            const checkTaskName = updateData.Task_Name || task.Task_Name;
            const checkTaskGroupId = updateData.Task_Type_Id || task.Task_Type_Id;
            
            const existingTask = await Task.findOne({
                where: {
                    Task_Id: { [Op.ne]: id },
                    Task_Name: checkTaskName.trim(),
                    Task_Type_Id: checkTaskGroupId
                }
            });

            if (existingTask) {
                return res.status(409).json({
                    success: false,
                    message: 'Another task with this name already exists in the selected group'
                });
            }
        }

        // Prepare update data
        const finalUpdateData: any = {};
        if (updateData.Task_Name !== undefined) finalUpdateData.Task_Name = updateData.Task_Name.trim();
        if (updateData.Task_Desc !== undefined) finalUpdateData.Task_Desc = updateData.Task_Desc ? updateData.Task_Desc.trim() : null;
        if (updateData.Company_Id !== undefined) finalUpdateData.Company_Id = updateData.Company_Id;
        if (updateData.Task_Type_Id !== undefined) finalUpdateData.Task_Type_Id = updateData.Task_Type_Id;
        if (updateData.Project_Id !== undefined) finalUpdateData.Project_Id = updateData.Project_Id;
        
        // Add update metadata
        finalUpdateData.Update_By = (req as any).user?.id || 1;
        finalUpdateData.Update_Date = new Date();

        await task.update(finalUpdateData);
        
        const updatedTask = await Task.findByPk(id);
        
        return updated(res, {
            success: true,
            message: 'Task updated successfully',
            data: updatedTask
        });

    } catch (error: any) {
        console.error('Error updating task:', error);
        return servError(res, error.message || 'Internal server error');
    }
};

/**
 * Delete task
 */
export const deleteTask = async (req: Request, res: Response) => {
    try {
        // Validate ID parameter
        const validation = validateWithZod<{ id: number }>(taskIdSchema, { id: parseInt(req.params.id) });
        
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        const { id } = validation.data!;

        const task = await Task.findByPk(id);
        
        if (!task) {
            return notFound(res, 'Task not found');
        }

        await task.destroy();
        
    return res.status(200).json({
            success: true,
            message: 'Task deleted successfully'
        });

    } catch (error: any) {
        console.error('Error deleting task:', error);
        return servError(res, error.message || 'Internal server error');
    }
};

/**
 * Get tasks with null company_id
 */
export const getTasksWithNoCompany = async (req: Request, res: Response) => {
    try {
        const tasks = await Task.findAll({
            where: { Company_Id: null },
            order: [['Task_Name', 'ASC']]
        });

          return res.status(200).json({
            success: true,
            message: 'Tasks with no company retrieved successfully',
            data: tasks
        });

    } catch (error: any) {
        console.error('Error fetching tasks with no company:', error);
        return servError(res, error.message || 'Internal server error');
    }
};

/**
 * Get tasks with null Project_Id
 */
export const getTasksWithNoProject = async (req: Request, res: Response) => {
    try {
        const tasks = await Task.findAll({
            where: { Project_Id: null },
            order: [['Task_Name', 'ASC']]
        });

      return res.status(200).json({
            success: true,
            message: 'Tasks with no project retrieved successfully',
            data: tasks
        });

    } catch (error: any) {
        console.error('Error fetching tasks with no project:', error);
        return servError(res, error.message || 'Internal server error');
    }
};