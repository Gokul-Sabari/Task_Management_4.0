import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { ZodError } from 'zod';

import {
    leaveTypeCreateSchema,
    leaveTypeUpdateSchema,
    leaveTypeIdSchema,
    leaveTypeQuerySchema,
    LeaveTypeCreateInput,
    LeaveTypeUpdateInput,
    LeaveTypeQueryParams,
    LeaveType
} from '../../../models/masters/Leave type/leaveType.model';

/* ================= ZOD VALIDATION HELPER ================= */
const validateWithZod = <T>(schema: any, data: any) => {
    try {
        return { success: true, data: schema.parse(data) as T };
    } catch (err) {
        if (err instanceof ZodError) {
            return {
                success: false,
                errors: err.issues.map(e => ({
                    field: e.path.join('.') || 'unknown',
                    message: e.message
                }))
            };
        }
        return { success: false };
    }
};

/* ================= GET ALL ================= */
export const getAllLeaveTypes = async (req: Request, res: Response) => {
    try {
        const validation = validateWithZod<LeaveTypeQueryParams>(
            leaveTypeQuerySchema,
            req.query
        );

        if (!validation.success) {
            return res.status(400).json({ 
                success: false, 
                message: 'Validation failed',
                errors: validation.errors 
            });
        }

        const { 
            page = 1, 
            limit = 20, 
            search, 
            sortBy = 'Id', 
            sortOrder = 'ASC' 
        } = validation.data!;

        const where: any = {};

        // Add search filter if provided
        if (search && search.trim()) {
            where.LeaveType = { 
                [Op.like]: `%${search}%` 
            };
        }

        const offset = (page - 1) * limit;

        const { rows, count } = await LeaveType.findAndCountAll({
            where,
            limit,
            offset,
            order: [[sortBy, sortOrder]]
        });

        const totalPages = Math.ceil(count / limit);

        return res.status(200).json({
            success: true,
            message: 'Leave types retrieved successfully',
            data: rows,
            pagination: {
                totalRecords: count,
                currentPage: page,
                totalPages,
                pageSize: limit,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        });

    } catch (e: any) {
        console.error('Get All Error:', e);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? e.message : undefined
        });
    }
};

/* ================= GET BY ID ================= */
export const getLeaveTypeById = async (req: Request, res: Response) => {
    try {
        const validation = validateWithZod<{ id: number }>(
            leaveTypeIdSchema,
            req.params
        );

        if (!validation.success) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid ID parameter' 
            });
        }

        const leaveType = await LeaveType.findByPk(validation.data!.id);
        if (!leaveType) {
            return res.status(404).json({
                success: false,
                message: 'Leave type not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Leave type retrieved successfully',
            data: leaveType
        });

    } catch (e: any) {
        console.error('Get By ID Error:', e);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? e.message : undefined
        });
    }
};

/* ================= CREATE ================= */
export const createLeaveType = async (req: Request, res: Response) => {
    try {
        console.log('Request Body:', req.body);
        
        const validation = validateWithZod<LeaveTypeCreateInput>(
            leaveTypeCreateSchema,
            req.body
        );

        if (!validation.success) {
            return res.status(400).json({ 
                success: false, 
                message: 'Validation failed',
                errors: validation.errors 
            });
        }

        const { LeaveType: leaveTypeName } = validation.data!;

        // Check for duplicate leave type name
        const exists = await LeaveType.findOne({
            where: {
                LeaveType: leaveTypeName
            }
        });

        if (exists) {
            return res.status(409).json({
                success: false,
                message: 'Leave type already exists'
            });
        }

        // Create the leave type
        const leaveType = await LeaveType.create({
            LeaveType: leaveTypeName,
            Id: 0
        });

        return res.status(201).json({
            success: true,
            message: 'Leave type created successfully',
            data: leaveType
        });

    } catch (e: any) {
        console.error('Create Error Details:', {
            name: e.name,
            message: e.message,
            parent: e.parent?.message,
            sql: e.sql,
            stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
        });
        
        // Handle specific database errors
        if (e.name === 'SequelizeDatabaseError') {
            if (e.parent && e.parent.number === 515) {
                return res.status(500).json({
                    success: false,
                    message: 'Database error: ID column issue. Please ensure table has proper IDENTITY setup.',
                    suggestion: 'Contact database administrator to run: ALTER TABLE tbl_LeaveType ALTER COLUMN Id BIGINT IDENTITY(1,1) NOT NULL'
                });
            }
            
            return res.status(500).json({
                success: false,
                message: 'Database error occurred',
                error: e.parent?.message || e.message
            });
        }
        
        // Handle validation errors
        if (e.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: e.errors.map((err: any) => ({
                    field: err.path,
                    message: err.message
                }))
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? e.message : undefined
        });
    }
};

/* ================= UPDATE ================= */
export const updateLeaveType = async (req: Request, res: Response) => {
    try {
        // Validate ID parameter
        const idValidation = validateWithZod<{ id: number }>(
            leaveTypeIdSchema,
            req.params
        );

        if (!idValidation.success) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid ID parameter' 
            });
        }

        // Validate request body
        const bodyValidation = validateWithZod<LeaveTypeUpdateInput>(
            leaveTypeUpdateSchema,
            req.body
        );

        if (!bodyValidation.success) {
            return res.status(400).json({ 
                success: false, 
                message: 'Validation failed',
                errors: bodyValidation.errors 
            });
        }

        // Find the leave type
        const leaveType = await LeaveType.findByPk(idValidation.data!.id);
        if (!leaveType) {
            return res.status(404).json({
                success: false,
                message: 'Leave type not found'
            });
        }

        // Check for duplicate name (excluding current record)
        if (bodyValidation.data!.LeaveType) {
            const duplicate = await LeaveType.findOne({
                where: {
                    LeaveType: bodyValidation.data!.LeaveType,
                    Id: { [Op.ne]: leaveType.Id }
                }
            });

            if (duplicate) {
                return res.status(409).json({
                    success: false,
                    message: 'Leave type name already exists'
                });
            }
        }

        // Update the leave type
        await leaveType.update({
            LeaveType: bodyValidation.data!.LeaveType
        });
        
        // Fetch updated record
        const updatedLeaveType = await LeaveType.findByPk(leaveType.Id);

        return res.status(200).json({
            success: true,
            message: 'Leave type updated successfully',
            data: updatedLeaveType
        });

    } catch (e: any) {
        console.error('Update Error:', e);
        
        if (e.name === 'SequelizeDatabaseError') {
            return res.status(500).json({
                success: false,
                message: 'Database error occurred',
                error: e.parent?.message || e.message
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? e.message : undefined
        });
    }
};

/* ================= DELETE ================= */
export const deleteLeaveType = async (req: Request, res: Response) => {
    try {
        const validation = validateWithZod<{ id: number }>(
            leaveTypeIdSchema,
            req.params
        );

        if (!validation.success) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid ID parameter' 
            });
        }

        const leaveType = await LeaveType.findByPk(validation.data!.id);
        if (!leaveType) {
            return res.status(404).json({
                success: false,
                message: 'Leave type not found'
            });
        }

        // Hard delete (permanent removal)
        await leaveType.destroy();
        
        return res.status(200).json({
            success: true,
            message: 'Leave type deleted successfully'
        });

    } catch (e: any) {
        console.error('Delete Error:', e);
        
        if (e.name === 'SequelizeDatabaseError') {
            return res.status(500).json({
                success: false,
                message: 'Database error occurred',
                error: e.parent?.message || e.message
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? e.message : undefined
        });
    }
};

/* ================= DROPDOWN ================= */
export const getLeaveTypeDropdown = async (req: Request, res: Response) => {
    try {
        const leaveTypes = await LeaveType.findAll({
            attributes: [
                ['Id', 'value'],
                ['LeaveType', 'label']
            ],
            order: [['LeaveType', 'ASC']]
        });

        return res.status(200).json({
            success: true,
            message: 'Leave types for dropdown retrieved successfully',
            data: leaveTypes
        });

    } catch (e: any) {
        console.error('Dropdown Error:', e);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? e.message : undefined
        });
    }
};