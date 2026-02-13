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
    TaskType_Master,
    taskTypeCreateSchema,
    taskTypeUpdateSchema,
    taskTypeQuerySchema,
    taskTypeIdSchema,
    TaskTypeCreateInput,
    TaskTypeUpdateInput,
    TaskTypeQueryParams
} from '../../../models/masters/taskType/type.model';
import { ZodError } from 'zod';
import { Op } from 'sequelize';
import { Project } from '../../../models/masters/project/type.model';
import { Task } from '../../../models/masters/task/type.model'

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

// Helper function to convert date strings to Date objects
const prepareTaskTypeData = (data: any) => {
    const preparedData = { ...data };

    // Convert date strings to Date objects
    if (preparedData.Est_StartTime && typeof preparedData.Est_StartTime === 'string') {
        preparedData.Est_StartTime = new Date(preparedData.Est_StartTime);
    }

    if (preparedData.Est_EndTime && typeof preparedData.Est_EndTime === 'string') {
        preparedData.Est_EndTime = new Date(preparedData.Est_EndTime);
    }

    return preparedData;
};

export const getAllTaskTypes = async (req: Request, res: Response) => {
    try {

        const queryData = {
            ...req.query
        };

        const validation = validateWithZod<any>(taskTypeQuerySchema, queryData);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid query parameters',
                errors: validation.errors
            });
        }

        const queryParams = validation.data!;

        const where: any = {
            TT_Del_Flag: queryParams.ttDelFlag === '1' ? 1 : 0,
            Status: queryParams.status === '1' ? 1 : 0
        };

        if (queryParams.search) {
            where.Task_Type = {
                [Op.like]: `%${queryParams.search}%`
            };
        }

        if (queryParams.projectId) {
            where.Project_Id = queryParams.projectId;
        }

        if (queryParams.isReptative) {
            where.Is_Reptative = queryParams.isReptative === '1' ? 1 : 0;
        }

        const { rows, count } = await TaskType_Master.findAndCountAll({
            where,
            limit: queryParams.limit,
            offset: (queryParams.page - 1) * queryParams.limit,
        });

        const projectIds = rows
            .map(row => row.Project_Id)
            .filter((id): id is number => id !== null && id !== undefined)
            .filter((id, index, self) => self.indexOf(id) === index);

        const projectsMap = new Map<number, string>();
        if (projectIds.length > 0) {
            const projects = await Project.findAll({
                where: {
                    Project_Id: projectIds
                },
                attributes: ['Project_Id', 'Project_Name']
            });
            
            projects.forEach(project => {
                const projectId = project.Project_Id;
                const projectName = project.Project_Name;
                
                // Convert projectId to number and ensure projectName is not null
                if (projectName !== null) {
                    const numId = Number(projectId);
                    if (!isNaN(numId)) {
                        projectsMap.set(numId, projectName);
                    }
                }
            });
        }

        const formattedRows = rows.map(row => {
            const taskType = row.toJSON();
            const projectId = taskType.Project_Id;
            
            let projectName: string | null = null;
            if (projectId !== null && projectId !== undefined) {
                const numProjectId = Number(projectId);
                if (!isNaN(numProjectId)) {
                    projectName = projectsMap.get(numProjectId) || null;
                }
            }
            
            return {
                ...taskType,
                Project_Name: projectName
            };
        });

        return sentData(res, formattedRows);

    } catch (err) {
        console.error('Error fetching task types:', err);
        servError(err, res);
    }
};


export const getTaskTypeById = async (req: Request, res: Response) => {
    try {

        const validation = validateWithZod<{ id: number }>(
            taskTypeIdSchema,
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

        const taskType = await TaskType_Master.findOne({
            where: {
                Task_Type_Id: id,
                TT_Del_Flag: 0
            }
        });

        if (!taskType) {
            return notFound(res, 'Task Type not found');
        }

        const projectId = taskType.Project_Id;
        let projectName: string | null = null;

        if (projectId !== null && projectId !== undefined) {
            const project = await Project.findOne({
                where: {
                    Project_Id: projectId
                },
                attributes: ['Project_Id', 'Project_Name']
            });

            projectName = project ? project.Project_Name : null;
        }

        const formattedData = {
            ...taskType.toJSON(),
            Project_Name: projectName
        };

        return res.status(200).json({
            success: true,
            message: 'Task Type fetched successfully',
            data: formattedData
        });

    } catch (e) {
        console.error('Error fetching task type by ID:', e);
        servError(e, res);
    }
};


export const createTaskType = async (req: Request, res: Response) => {
    try {
    
        const normalizedBody = {
            ...req.body,
            Task_Type: req.body.Task_Type?.trim()
        };

        if (normalizedBody.Task_Type) {
            const existing = await TaskType_Master.findOne({
                where: {
                    Task_Type: normalizedBody.Task_Type,
                    TT_Del_Flag: 0
                }
            });

            if (existing) {
                return res.status(409).json({
                    success: false,
                    message: 'Task Type with this name already exists',
                    field: 'Task_Type'
                });
            }
        }

        const preparedData = {
            ...normalizedBody,
            TT_Del_Flag: 0,
            Status: 1,
            Est_StartTime: normalizedBody.Est_StartTime
                ? new Date(normalizedBody.Est_StartTime)
                : null,
            Est_EndTime: normalizedBody.Est_EndTime
                ? new Date(normalizedBody.Est_EndTime)
                : null
        };

        const validation = validateWithZod<TaskTypeCreateInput>(
            taskTypeCreateSchema,
            preparedData
        );

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        const taskType = await TaskType_Master.create(validation.data);

        return created(res, taskType, 'Task Type created successfully');

    } catch (error) {
        console.error('Error creating task type:', error);
        return servError(error, res);
    }
};


export const updateTaskType = async (req: Request, res: Response) => {
    try {
      
        const idValidation = validateWithZod<{ id: number }>(taskTypeIdSchema, req.params);
        if (!idValidation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID parameter',
                errors: idValidation.errors
            });
        }

        const { id } = idValidation.data!;

        const taskType = await TaskType_Master.findOne({
            where: {
                Task_Type_Id: id,
                TT_Del_Flag: 0
            }
        });

        if (!taskType) {
            return notFound(res, 'Task Type not found or has been deleted');
        }

        if (req.body.Task_Type && req.body.Task_Type !== taskType.Task_Type) {
            const duplicateTaskType = await TaskType_Master.findOne({
                where: {
                    Task_Type: req.body.Task_Type.trim(),
                    TT_Del_Flag: 0,
                    Task_Type_Id: { [Op.ne]: id }
                }
            });

            if (duplicateTaskType) {
                return res.status(409).json({
                    success: false,
                    message: 'Another Task Type with this name already exists',
                    field: 'Task_Type'
                });
            }
        }

        const validation = validateWithZod<TaskTypeUpdateInput>(taskTypeUpdateSchema, req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        const validatedBody = validation.data!;

        const updateData = prepareTaskTypeData(validatedBody);

        await taskType.update(updateData);

        updated(res, taskType, 'Task Type updated successfully');

    } catch (e) {
        console.error('Error updating task type:', e);
        servError(e, res);
    }
};

export const deleteTaskType = async (req: Request, res: Response) => {
    try {

        const validation = validateWithZod<{ id: number }>(taskTypeIdSchema, req.params);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID parameter',
                errors: validation.errors
            });
        }

        const { id } = validation.data!;

        const taskType = await TaskType_Master.findByPk(id);

        if (!taskType) {
            return notFound(res, 'Task Type not found');
        }

        await taskType.update({
            TT_Del_Flag: 1,
            Status: 0
        });

        deleted(res, 'Task Type deleted successfully');

    } catch (e) {
        console.error('Error deleting task type:', e);
        servError(e, res);
    }
};

export const getActiveTaskTypes = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.query;

        const whereClause: any = {
            TT_Del_Flag: 0,
            Status: 1
        };

        if (projectId && !isNaN(Number(projectId))) {
            whereClause.Project_Id = Number(projectId);
        }

        const taskTypes = await TaskType_Master.findAll({
            where: whereClause,
            order: [['Task_Type', 'ASC']]
        });

        sentData(res, taskTypes);

    } catch (e) {
        console.error('Error fetching active task types:', e);
        servError(e, res);
    }
};


export const restoreTaskType = async (req: Request, res: Response) => {
    try {
   
        const validation = validateWithZod<{ id: number }>(taskTypeIdSchema, req.params);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Valid ID parameter is required',
                errors: validation.errors
            });
        }

        const { id } = validation.data!;

        const taskType = await TaskType_Master.findByPk(id);

        if (!taskType) {
            return notFound(res, 'Task Type not found');
        }

        await taskType.update({
            TT_Del_Flag: 0,
            Status: 1
        });

        res.status(200).json({
            success: true,
            message: 'Task Type restored successfully',
            data: taskType
        });

    } catch (error) {
        console.error('Error restoring task type:', error);
        servError(error as Error, res);
    }
};


export const hardDeleteTaskType = async (req: Request, res: Response) => {
    try {
  
        const validation = validateWithZod<{ id: number }>(taskTypeIdSchema, req.params);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Valid ID parameter is required',
                errors: validation.errors
            });
        }

        const { id } = validation.data!;

        const taskType = await TaskType_Master.findByPk(id);

        if (!taskType) {
            return notFound(res, 'Task Type not found');
        }

        await taskType.destroy();

        res.status(200).json({
            success: true,
            message: 'Task Type permanently deleted'
        });

    } catch (error) {
        console.error('Error hard deleting task type:', error);
        servError(error as Error, res);
    }
};


export const getTaskTypesByProjectId = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;

        if (!projectId) {
            return res.status(400).json({
                success: false,
                message: 'Project ID is required'
            });
        }

        const taskTypes = await TaskType_Master.findAll({
            attributes: [
                'Task_Type_Id',
                'Task_Type',
                'Is_Reptative',
                'Hours_Duration',
                'Day_Duration'
            ],
            where: {
                Project_Id: projectId,
                TT_Del_Flag: 0,
                Status: 1
            },
            order: [['Task_Type', 'ASC']],
            raw: true
        });

        sentData(res, taskTypes);

    } catch (e) {
        console.error('Error fetching task types by project:', e);
        servError(e, res);
    }
};

export const getTaskTypesByTaskId = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    if (!taskId || isNaN(Number(taskId))) {
      return res.status(400).json({
        success: false,
        message: 'Valid Task ID is required'
      });
    }

    const task = await Task.findOne({
      where: {
        Task_Id: Number(taskId)
      },
      attributes: [], // we only need TaskType
      include: [
        {
          model: TaskType_Master,
          attributes: [
            'Task_Type_Id',
            'Task_Group_Id',
            'Task_Type',
            'Is_Reptative',
            'Hours_Duration',
            'Day_Duration'
          ],
          where: {
            TT_Del_Flag: 0,
            Status: 1
          },
          required: true
        }
      ]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task Type not found for this Task'
      });
    }

    // ✅ Sequelize stores include result here
    // @ts-ignore
    sentData(res, task.TaskType_Master);

  } catch (e) {
    console.error('Error fetching task type by task:', e);
    servError(e, res);
  }
};