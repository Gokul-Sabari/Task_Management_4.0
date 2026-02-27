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
    WorkParameter
} from '../../../models/masters/workParamter/type.model';
import { WorkMaster } from '../../../models/masters/workMaster/type.model';
import { ZodError } from 'zod';
import { Op } from 'sequelize';
import { z } from "zod";

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

// Validation Schemas
const workParameterCreateSchema = z.object({
    Work_Id: z.number(),
    Task_Id: z.number(),
    Param_Id: z.number(),
    Default_Value: z.string().optional().nullable(),
    Current_Value: z.string().optional().nullable()
});

const workParameterUpdateSchema = z.object({
    Work_Id: z.number().optional(),
    Task_Id: z.number().optional(),
    Param_Id: z.number().optional(),
    Default_Value: z.string().optional().nullable(),
    Current_Value: z.string().optional().nullable()
});

const workParameterIdSchema = z.object({
    id: z.union([z.string(), z.number()]).transform(val => Number(val))
});

const workParameterListQuerySchema = z.object({
    page: z.string().optional().transform(val => (val ? parseInt(val) : 1)),
    limit: z.string().optional().transform(val => (val ? parseInt(val) : 10)),
    search: z.string().optional(),
    workId: z.string().optional().transform(val => (val ? parseInt(val) : undefined)),
    taskId: z.string().optional().transform(val => (val ? parseInt(val) : undefined)),
    paramId: z.string().optional().transform(val => (val ? parseInt(val) : undefined))
});

type WorkParameterCreateInput = z.infer<typeof workParameterCreateSchema>;
type WorkParameterUpdateInput = z.infer<typeof workParameterUpdateSchema>;
type WorkParameterListQuery = z.infer<typeof workParameterListQuerySchema>;

// GET ALL with pagination and filters
export const getAllWorkParameters = async (req: Request, res: Response) => {
    try {
        const queryData = {
            ...req.query
        };

        const validation = validateWithZod<WorkParameterListQuery>(workParameterListQuerySchema, queryData);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid query parameters',
                errors: validation.errors
            });
        }

        const queryParams = validation.data!; // Using ! is safe here because success is true

        const where: any = {};

        if (queryParams.workId) {
            where.Work_Id = queryParams.workId;
        }

        if (queryParams.taskId) {
            where.Task_Id = queryParams.taskId;
        }

        if (queryParams.paramId) {
            where.Param_Id = queryParams.paramId;
        }

        if (queryParams.search) {
            where[Op.or] = [
                { Default_Value: { [Op.like]: `%${queryParams.search}%` } },
                { Current_Value: { [Op.like]: `%${queryParams.search}%` } }
            ];
        }

        const { rows, count } = await WorkParameter.findAndCountAll({
            where,
            limit: queryParams.limit,
            offset: (queryParams.page - 1) * queryParams.limit,
            include: [{
                model: WorkMaster,
                as: 'workMaster',
                attributes: ['Work_Id', 'Work_Dt', 'Work_Status'],
                required: false
            }],
            order: [['Work_Id', 'ASC'], ['Param_Id', 'ASC']]
        });

        return res.status(200).json({
            success: true,
            data: {
                items: rows,
                pagination: {
                    page: queryParams.page,
                    limit: queryParams.limit,
                    total: count,
                    totalPages: Math.ceil(count / queryParams.limit)
                }
            }
        });

    } catch (err) {
        console.error('Error fetching work parameters:', err);
        servError(err, res);
    }
};

// GET BY ID
export const getWorkParameterById = async (req: Request, res: Response) => {
    try {
        const validation = validateWithZod<{ id: number }>(
            workParameterIdSchema,
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

        const workParameter = await WorkParameter.findOne({
            where: {
                WNo: id
            },
            include: [{
                model: WorkMaster,
                as: 'workMaster',
                required: false
            }]
        });

        if (!workParameter) {
            return notFound(res, 'Work parameter not found');
        }

        return res.status(200).json({
            success: true,
            message: 'Work parameter fetched successfully',
            data: workParameter
        });

    } catch (e) {
        console.error('Error fetching work parameter by ID:', e);
        servError(e, res);
    }
};

// CREATE new work parameter
export const createWorkParameter = async (req: Request, res: Response) => {
    try {
        // Check if Work_Id exists in WorkMaster
        if (req.body.Work_Id) {
            const workExists = await WorkMaster.findOne({
                where: { Work_Id: req.body.Work_Id }
            });

            if (!workExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Work ID does not exist in Work Master',
                    field: 'Work_Id'
                });
            }
        }

        // Check for duplicate (Work_Id + Param_Id combination)
        if (req.body.Work_Id && req.body.Param_Id) {
            const existing = await WorkParameter.findOne({
                where: {
                    Work_Id: req.body.Work_Id,
                    Param_Id: req.body.Param_Id
                }
            });

            if (existing) {
                return res.status(409).json({
                    success: false,
                    message: 'Parameter already exists for this work',
                    field: 'Param_Id'
                });
            }
        }

        const validation = validateWithZod<WorkParameterCreateInput>(
            workParameterCreateSchema,
            req.body
        );

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        // ✅ Fix: Check if validation.data exists
        if (!validation.data) {
            return res.status(400).json({
                success: false,
                message: 'Validation data is missing'
            });
        }

        const workParameter = await WorkParameter.create(validation.data);

        // Fetch with association
        const result = await WorkParameter.findOne({
            where: { WNo: workParameter.WNo },
            include: [{
                model: WorkMaster,
                as: 'workMaster',
                required: false
            }]
        });

        return created(res, result, 'Work parameter created successfully');

    } catch (error) {
        console.error('Error creating work parameter:', error);
        return servError(error, res);
    }
};

// UPDATE work parameter
export const updateWorkParameter = async (req: Request, res: Response) => {
    try {
        const idValidation = validateWithZod<{ id: number }>(workParameterIdSchema, req.params);
        if (!idValidation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID parameter',
                errors: idValidation.errors
            });
        }

        const { id } = idValidation.data!;

        const workParameter = await WorkParameter.findOne({
            where: { WNo: id }
        });

        if (!workParameter) {
            return notFound(res, 'Work parameter not found');
        }

        // If updating Work_Id, check if it exists in WorkMaster
        if (req.body.Work_Id && req.body.Work_Id !== workParameter.Work_Id) {
            const workExists = await WorkMaster.findOne({
                where: { Work_Id: req.body.Work_Id }
            });

            if (!workExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Work ID does not exist in Work Master',
                    field: 'Work_Id'
                });
            }
        }

        // Check for duplicate if changing Work_Id or Param_Id
        if ((req.body.Work_Id && req.body.Work_Id !== workParameter.Work_Id) || 
            (req.body.Param_Id && req.body.Param_Id !== workParameter.Param_Id)) {
            
            const duplicate = await WorkParameter.findOne({
                where: {
                    Work_Id: req.body.Work_Id || workParameter.Work_Id,
                    Param_Id: req.body.Param_Id || workParameter.Param_Id,
                    WNo: { [Op.ne]: id }
                }
            });

            if (duplicate) {
                return res.status(409).json({
                    success: false,
                    message: 'Parameter already exists for this work',
                    field: 'Param_Id'
                });
            }
        }

        const validation = validateWithZod<WorkParameterUpdateInput>(
            workParameterUpdateSchema,
            req.body
        );

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        // ✅ Fix: Check if validation.data exists
        if (!validation.data) {
            return res.status(400).json({
                success: false,
                message: 'Validation data is missing'
            });
        }

        await workParameter.update(validation.data);

        // Fetch updated data with association
        const result = await WorkParameter.findOne({
            where: { WNo: id },
            include: [{
                model: WorkMaster,
                as: 'workMaster',
                required: false
            }]
        });

        updated(res, result, 'Work parameter updated successfully');

    } catch (e) {
        console.error('Error updating work parameter:', e);
        servError(e, res);
    }
};

// DELETE work parameter
export const deleteWorkParameter = async (req: Request, res: Response) => {
    try {
        const validation = validateWithZod<{ id: number }>(workParameterIdSchema, req.params);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID parameter',
                errors: validation.errors
            });
        }

        const { id } = validation.data!;

        const workParameter = await WorkParameter.findByPk(id);

        if (!workParameter) {
            return notFound(res, 'Work parameter not found');
        }

        await workParameter.destroy();

        deleted(res, 'Work parameter deleted successfully');

    } catch (e) {
        console.error('Error deleting work parameter:', e);
        servError(e, res);
    }
};

// GET parameters by Work ID
export const getParametersByWorkId = async (req: Request, res: Response) => {
    try {
        const { workId } = req.params;

        if (!workId || isNaN(Number(workId))) {
            return res.status(400).json({
                success: false,
                message: 'Valid Work ID is required'
            });
        }

        const parameters = await WorkParameter.findAll({
            where: {
                Work_Id: Number(workId)
            },
            include: [{
                model: WorkMaster,
                as: 'workMaster',
                where: { Work_Id: Number(workId) },
                required: false,
                attributes: ['Work_Dt', 'Work_Status']
            }],
            order: [['Param_Id', 'ASC']]
        });

        sentData(res, parameters);

    } catch (e) {
        console.error('Error fetching parameters by work ID:', e);
        servError(e, res);
    }
};

// GET parameters by Task ID
export const getParametersByTaskId = async (req: Request, res: Response) => {
    try {
        const { taskId } = req.params;

        if (!taskId || isNaN(Number(taskId))) {
            return res.status(400).json({
                success: false,
                message: 'Valid Task ID is required'
            });
        }

        const parameters = await WorkParameter.findAll({
            where: {
                Task_Id: Number(taskId)
            },
            include: [{
                model: WorkMaster,
                as: 'workMaster',
                required: false,
                attributes: ['Work_Id', 'Work_Dt', 'Work_Status']
            }],
            order: [['Work_Id', 'ASC'], ['Param_Id', 'ASC']]
        });

        sentData(res, parameters);

    } catch (e) {
        console.error('Error fetching parameters by task ID:', e);
        servError(e, res);
    }
};

// GET parameters by Param ID
export const getParametersByParamId = async (req: Request, res: Response) => {
    try {
        const { paramId } = req.params;

        if (!paramId || isNaN(Number(paramId))) {
            return res.status(400).json({
                success: false,
                message: 'Valid Parameter ID is required'
            });
        }

        const parameters = await WorkParameter.findAll({
            where: {
                Param_Id: Number(paramId)
            },
            include: [{
                model: WorkMaster,
                as: 'workMaster',
                required: false,
                attributes: ['Work_Id', 'Work_Dt', 'Work_Status']
            }],
            order: [['Work_Id', 'DESC']]
        });

        sentData(res, parameters);

    } catch (e) {
        console.error('Error fetching parameters by param ID:', e);
        servError(e, res);
    }
};

// BULK CREATE work parameters
export const bulkCreateWorkParameters = async (req: Request, res: Response) => {
    try {
        const validation = validateWithZod<WorkParameterCreateInput[]>(
            workParameterCreateSchema.array(),
            req.body
        );

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        // ✅ Fix: Check if validation.data exists
        if (!validation.data) {
            return res.status(400).json({
                success: false,
                message: 'Validation data is missing'
            });
        }

        const parametersData = validation.data;
        
        // Check for duplicate combinations within the batch
        const combinations = new Set();
        const duplicates: string[] = [];

        for (const data of parametersData) {
            const key = `${data.Work_Id}-${data.Param_Id}`;
            if (combinations.has(key)) {
                duplicates.push(`Work_Id: ${data.Work_Id}, Param_Id: ${data.Param_Id}`);
            }
            combinations.add(key);
        }

        if (duplicates.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Duplicate combinations found in batch',
                duplicates
            });
        }

        // Check if all Work_Id exist in WorkMaster
        const workIds = [...new Set(parametersData.map(p => p.Work_Id))];
        const existingWorks = await WorkMaster.findAll({
            where: { Work_Id: { [Op.in]: workIds } },
            attributes: ['Work_Id']
        });

        const existingWorkIds = existingWorks.map(w => w.Work_Id);
        const missingWorkIds = workIds.filter(id => !existingWorkIds.includes(id));

        if (missingWorkIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Some Work IDs do not exist in Work Master',
                missingWorkIds
            });
        }

        // Check for existing combinations in database
        const existingParameters = await WorkParameter.findAll({
            where: {
                [Op.or]: parametersData.map(p => ({
                    Work_Id: p.Work_Id,
                    Param_Id: p.Param_Id
                }))
            },
            attributes: ['Work_Id', 'Param_Id']
        });

        if (existingParameters.length > 0) {
            const existingPairs = existingParameters.map(p => 
                `Work_Id: ${p.Work_Id}, Param_Id: ${p.Param_Id}`
            );
            return res.status(409).json({
                success: false,
                message: 'Some parameter combinations already exist',
                existing: existingPairs
            });
        }

        const createdParameters = await WorkParameter.bulkCreate(parametersData);

        // Fetch created parameters with associations
        const createdIds = createdParameters.map(p => p.WNo);
        const results = await WorkParameter.findAll({
            where: { WNo: { [Op.in]: createdIds } },
            include: [{
                model: WorkMaster,
                as: 'workMaster',
                required: false
            }],
            order: [['Work_Id', 'ASC'], ['Param_Id', 'ASC']]
        });

        return res.status(201).json({
            success: true,
            message: `${results.length} work parameters created successfully`,
            data: results
        });

    } catch (error) {
        console.error('Error bulk creating work parameters:', error);
        servError(error as Error, res);
    }
};