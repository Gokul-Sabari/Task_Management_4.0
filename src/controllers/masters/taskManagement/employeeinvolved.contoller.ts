// controllers/masters/taskManagement/employeeinvolved.contoller.ts
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
    ProjectEmployeeCreationSchema,
    ProjectEmployeeBulkCreateSchema,
    ProjectEmployeeUpdateSchema,
    ProjectEmployeeBulkUpdateSchema,
    ProjectEmployeeQuerySchema,
    ProjectEmployeeIdSchema,
    ProjectIdSchema,
    ProjectEmployeeCreate,
    ProjectEmployeeBulkCreate,
    ProjectEmployeeUpdate,
    ProjectEmployeeBulkUpdate,
    ProjectEmployeeQuery,
    ProjectEmployee
} from '../../../models/masters/employee involved/type.model';
import Project from '../../../models/masters/project/type.model';
import Employee from '../../../models/masters/employee/type.model';
import { ZodError } from 'zod';
import { sequelize } from '../../../config/sequalizer';
import { Op } from 'sequelize';

/* -------------------- COMMON ZOD VALIDATION -------------------- */
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

/* -------------------- GET ALL - GROUPED BY PROJECT (FOR FRONTEND TABLE) -------------------- */
export const getAllProjectEmployee = async (req: Request, res: Response) => {
    try {
        // Get query parameters
        const queryParams = {
            page: req.query.page,
            limit: req.query.limit || 500,
            search: req.query.search,
            Project_Id: req.query.Project_Id,
            Emp_Id: req.query.Emp_Id,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder
        };

        const validation = validateWithZod<ProjectEmployeeQuery>(
            ProjectEmployeeQuerySchema,
            queryParams
        );

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid query parameters',
                errors: validation.errors
            });
        }

        const queryData = validation.data!;
        const page = queryData.page || 1;
        const limit = queryData.limit || 500;
        const sortBy = queryData.sortBy || 'Project_Id';
        const sortOrder = queryData.sortOrder || 'ASC';

        // Build where conditions for ProjectEmployee only
        const where: any = {
            Del_Flag: 0
        };
        
        if (queryData.Project_Id !== undefined) {
            where.Project_Id = queryData.Project_Id;
        }

        if (queryData.Emp_Id !== undefined) {
            where.Emp_Id = queryData.Emp_Id;
        }

        // Calculate offset for pagination
        const offset = (page - 1) * limit;

        // Get total count
        const totalCount = await ProjectEmployee.count({
            where
        });

        // Get paginated data with joins to get Project_Name and Emp_Name
        const rows = await ProjectEmployee.findAll({
            where,
            include: [
                {
                    model: Project,
                    as: 'project',
                    attributes: ['Project_Name'],
                    required: false
                },
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['Emp_Name'],
                    required: false
                }
            ],
            order: [[sortBy, sortOrder]],
            limit: limit,
            offset: offset
        });

        // Group data by Project for frontend
        const projectMap = new Map();
        
        rows.forEach(row => {
            const rowData = row.toJSON();
            const projectId = rowData.Project_Id;
            
            // Skip if project ID is null
            if (!projectId) return;
            
            const projectName = rowData.project?.Project_Name || `Project ${projectId}`;
            
            if (!projectMap.has(projectId)) {
                projectMap.set(projectId, {
                    Project_Id: projectId,
                    Project_Name: projectName,
                    Employees: []
                });
            }
            
            const project = projectMap.get(projectId);
            
            // Add employee if Emp_Id exists
            if (rowData.Emp_Id) {
                project.Employees.push({
                    Employee_Id: rowData.Employee_Id,
                    Emp_Id: rowData.Emp_Id,
                    Emp_Name: rowData.employee?.Emp_Name || `Employee ${rowData.Emp_Id}`
                });
            }
        });

        // Convert map to array and sort by project name
        const groupedData = Array.from(projectMap.values()).sort((a, b) => 
            a.Project_Name.localeCompare(b.Project_Name)
        );

        // Prepare pagination metadata
        const metadata = {
            totalRecords: totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            pageSize: limit,
            hasNextPage: page < Math.ceil(totalCount / limit),
            hasPreviousPage: page > 1
        };

        res.json({
            success: true,
            message: 'Project employees retrieved successfully',
            data: groupedData,
            metadata: metadata
        });
    } catch (e: any) {
        console.error('Error in getAllProjectEmployee:', e);
        servError(e, res);
    }
};

/* -------------------- GET BY ID -------------------- */
export const getProjectEmployeeById = async (req: Request, res: Response) => {
    try {
        const validation = validateWithZod<{ id: number }>(
            ProjectEmployeeIdSchema,
            req.params
        );

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID parameter',
                errors: validation.errors
            });
        }

        const projectEmployee = await ProjectEmployee.findOne({
            where: {
                Employee_Id: validation.data!.id,
                Del_Flag: 0
            },
            include: [
                {
                    model: Project,
                    as: 'project',
                    attributes: ['Project_Name'],
                    required: false
                },
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['Emp_Name'],
                    required: false
                }
            ]
        });

        if (!projectEmployee) {
            return notFound(res, 'Project Employee not found');
        }

        const rowData = projectEmployee.toJSON();
        const flattenedData = {
            Employee_Id: rowData.Employee_Id,
            Project_Id: rowData.Project_Id,
            Project_Name: rowData.project?.Project_Name || null,
            Emp_Id: rowData.Emp_Id,
            Emp_Name: rowData.employee?.Emp_Name || null
        };

        sentData(res, [flattenedData]);
    } catch (e: any) {
        console.error('Error in getProjectEmployeeById:', e);
        servError(e, res);
    }
};

/* -------------------- GET BY PROJECT ID -------------------- */
export const getProjectEmployeesByProjectId = async (req: Request, res: Response) => {
    try {
        const validation = validateWithZod<{ projectId: number }>(
            ProjectIdSchema,
            req.params
        );

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Project ID parameter',
                errors: validation.errors
            });
        }

        const projectId = validation.data!.projectId;

        const projectEmployees = await ProjectEmployee.findAll({
            where: {
                Project_Id: projectId,
                Del_Flag: 0
            },
            include: [
                {
                    model: Project,
                    as: 'project',
                    attributes: ['Project_Name'],
                    required: false
                },
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['Emp_Name'],
                    required: false
                }
            ]
        });

        // Flatten data for frontend
        const data = projectEmployees.map(row => {
            const rowData = row.toJSON();
            return {
                Employee_Id: rowData.Employee_Id,
                Project_Id: rowData.Project_Id,
                Project_Name: rowData.project?.Project_Name || null,
                Emp_Id: rowData.Emp_Id,
                Emp_Name: rowData.employee?.Emp_Name || null
            };
        });

        sentData(res, data);
    } catch (e: any) {
        console.error('Error in getProjectEmployeesByProjectId:', e);
        servError(e, res);
    }
};

/* -------------------- CREATE SINGLE -------------------- */
export const createProjectEmployee = async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();
    
    try {
        const validation = validateWithZod<ProjectEmployeeCreate>(
            ProjectEmployeeCreationSchema,
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

        const createData = validation.data!;

        // Check if project exists - without Del_Flag if it doesn't exist
        if (createData.Project_Id) {
            const project = await Project.findByPk(createData.Project_Id, { transaction });
            if (!project) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Project not found'
                });
            }
        }

        // Check if employee exists - without Del_Flag if it doesn't exist
        if (createData.Emp_Id) {
            const employee = await Employee.findByPk(createData.Emp_Id, { transaction });
            if (!employee) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Employee not found'
                });
            }
        }

        // Check for duplicate
        const existing = await ProjectEmployee.findOne({
            where: {
                Project_Id: createData.Project_Id,
                Emp_Id: createData.Emp_Id,
                Del_Flag: 0
            },
            transaction
        });

        if (existing) {
            await transaction.rollback();
            return res.status(409).json({
                success: false,
                message: 'Project Employee already exists'
            });
        }

        // Create new ProjectEmployee
        const projectEmployee = await ProjectEmployee.create({
            Project_Id: createData.Project_Id || null,
            Emp_Id: createData.Emp_Id || null,
            Del_Flag: 0
        }, { transaction });

        await transaction.commit();

        // Fetch created record with names
        const createdWithNames = await ProjectEmployee.findByPk(projectEmployee.Employee_Id, {
            include: [
                {
                    model: Project,
                    as: 'project',
                    attributes: ['Project_Name']
                },
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['Emp_Name']
                }
            ]
        });

        const rowData = createdWithNames?.toJSON();
        const flattenedData = rowData ? {
            Employee_Id: rowData.Employee_Id,
            Project_Id: rowData.Project_Id,
            Project_Name: rowData.project?.Project_Name || null,
            Emp_Id: rowData.Emp_Id,
            Emp_Name: rowData.employee?.Emp_Name || null
        } : null;

        created(res, flattenedData ? [flattenedData] : [], 'Project Employee created successfully');
    } catch (e: any) {
        await transaction.rollback();
        console.error('Error in createProjectEmployee:', e);
        servError(e, res);
    }
};

/* -------------------- BULK CREATE -------------------- */
export const bulkCreateProjectEmployees = async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();
    
    try {
        const validation = validateWithZod<ProjectEmployeeBulkCreate>(
            ProjectEmployeeBulkCreateSchema,
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

        const createData = validation.data!;
        const projectId = createData.Project_Id;
        const empIds = createData.Emp_Ids;

        // Check if project exists
        const project = await Project.findByPk(projectId, { transaction });
        if (!project) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Check if employees exist - without Del_Flag filter if it doesn't exist
        const employees = await Employee.findAll({
            where: {
                Emp_Id: {
                    [Op.in]: empIds
                }
            },
            transaction
        });

        const existingEmpIds = employees.map(emp => emp.Emp_Id);
        const missingEmpIds = empIds.filter(id => !existingEmpIds.includes(id));

        if (missingEmpIds.length > 0) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: `Employees not found: ${missingEmpIds.join(', ')}`
            });
        }

        // Check for existing records
        const existingRecords = await ProjectEmployee.findAll({
            where: {
                Project_Id: projectId,
                Emp_Id: {
                    [Op.in]: empIds
                },
                Del_Flag: 0
            },
            transaction
        });

        const existingEmpIdSet = new Set(existingRecords.map(record => record.Emp_Id));
        const newEmpIds = empIds.filter(id => !existingEmpIdSet.has(id));

        if (newEmpIds.length === 0) {
            await transaction.rollback();
            return res.status(409).json({
                success: false,
                message: 'All selected employees are already assigned to this project'
            });
        }

        // Create new ProjectEmployees in bulk
        const projectEmployeesToCreate = newEmpIds.map(empId => ({
            Project_Id: projectId,
            Emp_Id: empId,
            Del_Flag: 0
        }));

        const createdEmployees = await ProjectEmployee.bulkCreate(
            projectEmployeesToCreate,
            { transaction }
        );

        await transaction.commit();

        res.status(201).json({
            success: true,
            message: `${createdEmployees.length} employee(s) assigned to project successfully`,
            data: {
                createdCount: createdEmployees.length,
                skippedCount: existingRecords.length,
                totalAssigned: createdEmployees.length + existingRecords.length
            }
        });
    } catch (e: any) {
        await transaction.rollback();
        console.error('Error in bulkCreateProjectEmployees:', e);
        servError(e, res);
    }
};

/* -------------------- UPDATE SINGLE -------------------- */
export const updateProjectEmployee = async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();
    
    try {
        // Validate ID parameter
        const idValidation = validateWithZod<{ id: number }>(
            ProjectEmployeeIdSchema,
            req.params
        );
        if (!idValidation.success) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Invalid ID parameter',
                errors: idValidation.errors
            });
        }

        // Validate body data
        const bodyValidation = validateWithZod<ProjectEmployeeUpdate>(
            ProjectEmployeeUpdateSchema,
            req.body
        );
        if (!bodyValidation.success) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Invalid update data',
                errors: bodyValidation.errors
            });
        }

        const id = idValidation.data!.id;
        const updateData = bodyValidation.data!;

        // Check if record exists
        const existing = await ProjectEmployee.findOne({
            where: {
                Employee_Id: id,
                Del_Flag: 0
            },
            transaction
        });

        if (!existing) {
            await transaction.rollback();
            return notFound(res, 'Project Employee not found');
        }

        // Check for duplicate if updating Project_Id or Emp_Id
        if (updateData.Project_Id !== undefined || updateData.Emp_Id !== undefined) {
            const duplicateWhere: any = {
                Employee_Id: { [Op.ne]: id },
                Del_Flag: 0
            };

            const existingData = existing.toJSON();
            
            duplicateWhere.Project_Id = updateData.Project_Id !== undefined ? updateData.Project_Id : existingData.Project_Id;
            duplicateWhere.Emp_Id = updateData.Emp_Id !== undefined ? updateData.Emp_Id : existingData.Emp_Id;

            const duplicate = await ProjectEmployee.findOne({
                where: duplicateWhere,
                transaction
            });

            if (duplicate) {
                await transaction.rollback();
                return res.status(409).json({
                    success: false,
                    message: 'Project Employee with these details already exists'
                });
            }
        }

        // Check if new project exists
        if (updateData.Project_Id) {
            const project = await Project.findByPk(updateData.Project_Id, { transaction });
            if (!project) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Project not found'
                });
            }
        }

        // Check if new employee exists
        if (updateData.Emp_Id) {
            const employee = await Employee.findByPk(updateData.Emp_Id, { transaction });
            if (!employee) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Employee not found'
                });
            }
        }

        // Update the record
        await existing.update(updateData, { transaction });

        await transaction.commit();

        // Fetch updated record with names
        const updatedRecord = await ProjectEmployee.findByPk(id, {
            include: [
                {
                    model: Project,
                    as: 'project',
                    attributes: ['Project_Name']
                },
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['Emp_Name']
                }
            ]
        });

        const rowData = updatedRecord?.toJSON();
        const flattenedData = rowData ? {
            Employee_Id: rowData.Employee_Id,
            Project_Id: rowData.Project_Id,
            Project_Name: rowData.project?.Project_Name || null,
            Emp_Id: rowData.Emp_Id,
            Emp_Name: rowData.employee?.Emp_Name || null
        } : null;

        updated(res, flattenedData ? [flattenedData] : [], 'Project Employee updated successfully');
    } catch (e: any) {
        await transaction.rollback();
        console.error('Error in updateProjectEmployee:', e);
        servError(e, res);
    }
};

/* -------------------- BULK UPDATE (SYNC PROJECT EMPLOYEES) -------------------- */
export const bulkUpdateProjectEmployees = async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();
    
    try {
        const validation = validateWithZod<ProjectEmployeeBulkUpdate>(
            ProjectEmployeeBulkUpdateSchema,
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

        const updateData = validation.data!;
        const projectId = updateData.Project_Id;
        const newEmpIds = updateData.Emp_Ids;

        // Check if project exists
        const project = await Project.findByPk(projectId, { transaction });
        if (!project) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Get current employees for this project
        const currentEmployees = await ProjectEmployee.findAll({
            where: {
                Project_Id: projectId,
                Del_Flag: 0
            },
            transaction
        });

        const currentEmpIds = currentEmployees
            .map(emp => emp.Emp_Id)
            .filter(id => id !== null) as number[];

        // Find employees to add and remove
        const employeesToAdd = newEmpIds.filter(id => !currentEmpIds.includes(id));
        const employeesToRemove = currentEmployees.filter(
            emp => emp.Emp_Id !== null && !newEmpIds.includes(emp.Emp_Id)
        );

        // Add new employees
        let addedCount = 0;
        if (employeesToAdd.length > 0) {
            // Check if employees exist
            const employees = await Employee.findAll({
                where: {
                    Emp_Id: {
                        [Op.in]: employeesToAdd
                    }
                },
                transaction
            });

            const existingEmpIds = employees.map(emp => emp.Emp_Id);
            const validEmployeesToAdd = employeesToAdd.filter(id => existingEmpIds.includes(id));

            if (validEmployeesToAdd.length > 0) {
                const createPromises = validEmployeesToAdd.map(empId => 
                    ProjectEmployee.create({
                        Project_Id: projectId,
                        Emp_Id: empId,
                        Del_Flag: 0
                    }, { transaction })
                );
                
                const createdEmployees = await Promise.all(createPromises);
                addedCount = createdEmployees.length;
            }
        }

        // Remove employees (soft delete)
        let removedCount = 0;
        if (employeesToRemove.length > 0) {
            const employeeIdsToRemove = employeesToRemove.map(emp => emp.Employee_Id);
            
            const [affectedCount] = await ProjectEmployee.update(
                { Del_Flag: 1 },
                {
                    where: {
                        Employee_Id: {
                            [Op.in]: employeeIdsToRemove
                        }
                    },
                    transaction
                }
            );
            removedCount = affectedCount;
        }

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: `Project employees updated successfully`,
            data: {
                added: addedCount,
                removed: removedCount,
                total: newEmpIds.length
            }
        });
    } catch (e: any) {
        await transaction.rollback();
        console.error('Error in bulkUpdateProjectEmployees:', e);
        servError(e, res);
    }
};

/* -------------------- DELETE (SOFT) -------------------- */
export const deleteProjectEmployee = async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();
    
    try {
        const validation = validateWithZod<{ id: number }>(
            ProjectEmployeeIdSchema,
            req.params
        );
        
        if (!validation.success) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Invalid ID parameter',
                errors: validation.errors
            });
        }

        const id = validation.data!.id;

        // Soft delete (set Del_Flag = 1)
        const [affectedCount] = await ProjectEmployee.update(
            { Del_Flag: 1 },
            {
                where: {
                    Employee_Id: id,
                    Del_Flag: 0
                },
                transaction
            }
        );

        if (affectedCount === 0) {
            await transaction.rollback();
            return notFound(res, 'Project Employee not found');
        }

        await transaction.commit();
        deleted(res, 'Project Employee deleted successfully');
    } catch (e: any) {
        await transaction.rollback();
        console.error('Error in deleteProjectEmployee:', e);
        servError(e, res);
    }
};

/* -------------------- BULK DELETE -------------------- */
export const bulkDeleteProjectEmployees = async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { projectId, empIds } = req.body;

        if (!projectId || !empIds || !Array.isArray(empIds) || empIds.length === 0) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Project ID and employee IDs array are required'
            });
        }

        // Find all project employee records for this project and employee IDs
        const recordsToDelete = await ProjectEmployee.findAll({
            where: {
                Project_Id: projectId,
                Emp_Id: {
                    [Op.in]: empIds
                },
                Del_Flag: 0
            },
            transaction
        });

        if (recordsToDelete.length === 0) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'No matching project employees found'
            });
        }

        const employeeIdsToDelete = recordsToDelete.map(record => record.Employee_Id);

        // Soft delete all matching records
        const [affectedCount] = await ProjectEmployee.update(
            { Del_Flag: 1 },
            {
                where: {
                    Employee_Id: {
                        [Op.in]: employeeIdsToDelete
                    }
                },
                transaction
            }
        );

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: `${affectedCount} employee(s) removed from project successfully`,
            data: {
                deletedCount: affectedCount
            }
        });
    } catch (e: any) {
        await transaction.rollback();
        console.error('Error in bulkDeleteProjectEmployees:', e);
        servError(e, res);
    }
};

/* -------------------- GET PROJECT DROPDOWN -------------------- */
export const getProjectDropdown = async (_: Request, res: Response) => {
    try {
        const projects = await Project.findAll({
            attributes: ['Project_Id', 'Project_Name'],
            order: [['Project_Name', 'ASC']]
        });

        const data = projects.map(project => ({
            Project_Id: project.Project_Id,
            Project_Name: project.Project_Name
        }));

        res.json({
            success: true,
            message: 'Projects retrieved successfully',
            data: data
        });
    } catch (e: any) {
        console.error('Error in getProjectDropdown:', e);
        servError(e, res);
    }
};

/* -------------------- GET EMPLOYEE DROPDOWN -------------------- */
export const getEmployeeDropdown = async (_: Request, res: Response) => {
    try {
        const employees = await Employee.findAll({
            attributes: ['Emp_Id', 'Emp_Name'],
            order: [['Emp_Name', 'ASC']]
        });

        const data = employees.map(employee => ({
            Emp_Id: employee.Emp_Id,
            Emp_Name: employee.Emp_Name
        }));

        res.json({
            success: true,
            message: 'Employees retrieved successfully',
            data: data
        });
    } catch (e: any) {
        console.error('Error in getEmployeeDropdown:', e);
        servError(e, res);
    }
};

/* -------------------- GET ALL ACTIVE (FLATTENED) -------------------- */
export const getAllActiveProjectEmployees = async (_: Request, res: Response) => {
    try {
        const rows = await ProjectEmployee.findAll({
            where: {
                Del_Flag: 0
            },
            include: [
                {
                    model: Project,
                    as: 'project',
                    attributes: ['Project_Name'],
                    required: false
                },
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ['Emp_Name'],
                    required: false
                }
            ],
            order: [['Employee_Id', 'ASC']]
        });

        // Flatten data for frontend
        const data = rows.map(row => {
            const rowData = row.toJSON();
            return {
                Employee_Id: rowData.Employee_Id,
                Project_Id: rowData.Project_Id,
                Project_Name: rowData.project?.Project_Name || null,
                Emp_Id: rowData.Emp_Id,
                Emp_Name: rowData.employee?.Emp_Name || null
            };
        });

        sentData(res, data);
    } catch (e: any) {
        console.error('Error in getAllActiveProjectEmployees:', e);
        servError(e, res);
    }
};