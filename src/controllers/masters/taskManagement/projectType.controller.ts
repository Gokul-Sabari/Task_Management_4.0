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
import { Project, getStatusText, getProjectStatusText, formatProjectForResponse } from '../../../models/masters/project/type.model'
import {
    projectCreateSchema,
    projectUpdateSchema,
    projectQuerySchema,
    projectIdSchema,
    ProjectCreateInput,
    ProjectUpdateInput,
    ProjectQueryParams
} from '../../../models/masters/project/type.model';

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
 * Get all projects with pagination and filtering
 */
export const getAllProjects = async (req: Request, res: Response) => {
    try {
        // Validate query parameters
        const validation = validateWithZod<ProjectQueryParams>(projectQuerySchema, req.query);
        
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
            Project_Name,
            Company_Id,
            Project_Status,
            Project_Head,
            IsActive,
            startDate,
            endDate,
            sortBy = 'Project_Id',
            sortOrder = 'DESC'
        } = validation.data!;

        const pageNum = Math.max(1, page);
        const limitNum = Math.min(Math.max(1, limit), 100);
        const offset = (pageNum - 1) * limitNum;

        // Build where clause
        const whereClause: any = {};
        
        if (Company_Id !== undefined && Company_Id !== null) whereClause.Company_Id = Company_Id;
        if (Project_Status !== undefined && Project_Status !== null) whereClause.Project_Status = Project_Status;
        if (Project_Head !== undefined && Project_Head !== null) whereClause.Project_Head = Project_Head;
        if (IsActive !== undefined && IsActive !== null) whereClause.IsActive = IsActive;
        
        if (Project_Name) {
            whereClause.Project_Name = { [Op.like]: `%${Project_Name}%` };
        }
        
        // Search functionality
        if (search) {
            whereClause[Op.or] = [
                { Project_Name: { [Op.like]: `%${search}%` } },
                { Project_Desc: { [Op.like]: `%${search}%` } }
            ];
        }
        
        // Date range filtering
        if (startDate || endDate) {
            whereClause.Est_Start_Dt = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                whereClause.Est_Start_Dt[Op.gte] = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                whereClause.Est_End_Dt = whereClause.Est_End_Dt || {};
                whereClause.Est_End_Dt[Op.lte] = end;
            }
        }

        // Validate sort parameters
        const validSortFields = ['Project_Id', 'Project_Name', 'Est_Start_Dt', 'Est_End_Dt', 'Entry_Date', 'Update_Date', 'IsActive', 'Project_Status'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'Project_Id';
        const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const { count, rows: projects } = await Project.findAndCountAll({
            where: whereClause,
            limit: limitNum,
            offset: offset,
            order: [[sortField, sortDirection]]
        });

        // Format projects with status text
        const formattedProjects = projects.map(project => formatProjectForResponse(project));

        return res.status(200).json({
            success: true,
            message: 'Projects retrieved successfully',
            data: formattedProjects,
            metadata: {
                totalRecords: count,
                currentPage: pageNum,
                totalPages: Math.ceil(count / limitNum),
                pageSize: limitNum,
                hasNextPage: pageNum < Math.ceil(count / limitNum),
                hasPreviousPage: pageNum > 1
            }
        });

    } catch (error: any) {
        console.error('Error fetching projects:', error);
        return servError(res, error.message || 'Internal server error');
    }
};

/**
 * Get project by ID
 */
export const getProjectById = async (req: Request, res: Response) => {
    try {
        // Validate ID parameter
        const validation = validateWithZod<{ id: number }>(projectIdSchema, { id: parseInt(req.params.id) });
        
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        const { id } = validation.data!;

        const project = await Project.findByPk(id);
        
        if (!project) {
            return notFound(res, 'Project not found');
        }

        // Format project with status text
        const formattedProject = formatProjectForResponse(project);

        return res.status(200).json({
            success: true,
            message: 'Project retrieved successfully',
            data: formattedProject
        });

    } catch (error: any) {
        console.error('Error fetching project:', error);
        return servError(res, error.message || 'Internal server error');
    }
};

/**
 * Get projects by company ID
 */
export const getProjectsByCompany = async (req: Request, res: Response) => {
    try {
        const { companyId } = req.params;
        
        if (!companyId || isNaN(parseInt(companyId))) {
            return res.status(400).json({
                success: false,
                message: 'Valid company ID is required'
            });
        }

        const projects = await Project.findAll({
            where: { 
                Company_Id: parseInt(companyId),
                IsActive: 1 
            },
            order: [['Project_Name', 'ASC']]
        });

        if (projects.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No projects found for this company',
                data: []
            });
        }

        // Format projects with status text
        const formattedProjects = projects.map(project => formatProjectForResponse(project));

        return res.status(200).json({
            success: true,
            message: 'Projects retrieved successfully',
            data: formattedProjects
        });

    } catch (error: any) {
        console.error('Error fetching projects by company:', error);
        return servError(res, error.message || 'Internal server error');
    }
};

/**
 * Get projects by project head ID
 */
export const getProjectsByProjectHead = async (req: Request, res: Response) => {
    try {
        const { projectHeadId } = req.params;
        
        if (!projectHeadId || isNaN(parseInt(projectHeadId))) {
            return res.status(400).json({
                success: false,
                message: 'Valid project head ID is required'
            });
        }

        const projects = await Project.findAll({
            where: { 
                Project_Head: parseInt(projectHeadId),
                IsActive: 1 
            },
            order: [['Project_Name', 'ASC']]
        });

        if (projects.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No projects found for this project head',
                data: []
            });
        }

        // Format projects with status text
        const formattedProjects = projects.map(project => formatProjectForResponse(project));

        return res.status(200).json({
            success: true,
            message: 'Projects retrieved successfully',
            data: formattedProjects
        });

    } catch (error: any) {
        console.error('Error fetching projects by project head:', error);
        return servError(res, error.message || 'Internal server error');
    }
};

/**
 * Get projects by status
 */
export const getProjectsByStatus = async (req: Request, res: Response) => {
    try {
        const { status } = req.params;
        
        if (!status || isNaN(parseInt(status))) {
            return res.status(400).json({
                success: false,
                message: 'Valid project status is required'
            });
        }

        const statusNum = parseInt(status);
        if (statusNum < 0 || statusNum > 5) {
            return res.status(400).json({
                success: false,
                message: 'Project status must be between 0 and 5'
            });
        }

        const projects = await Project.findAll({
            where: { 
                Project_Status: statusNum,
                IsActive: 1 
            },
            order: [['Project_Name', 'ASC']]
        });

        if (projects.length === 0) {
            return res.status(200).json({
                success: true,
                message: `No projects found with status ${status}`,
                data: []
            });
        }

        // Format projects with status text
        const formattedProjects = projects.map(project => formatProjectForResponse(project));

        return res.status(200).json({
            success: true,
            message: 'Projects retrieved successfully',
            data: formattedProjects
        });

    } catch (error: any) {
        console.error('Error fetching projects by status:', error);
        return servError(res, error.message || 'Internal server error');
    }
};

/**
 * Get active projects
 */
export const getActiveProjects = async (req: Request, res: Response) => {
    try {
        const projects = await Project.findAll({
            where: { 
                IsActive: 1 
            },
            order: [['Project_Name', 'ASC']]
        });

        if (projects.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No active projects found',
                data: []
            });
        }

        // Format projects with status text
        const formattedProjects = projects.map(project => formatProjectForResponse(project));

        return res.status(200).json({
            success: true,
            message: 'Active projects retrieved successfully',
            data: formattedProjects
        });

    } catch (error: any) {
        console.error('Error fetching active projects:', error);
        return servError(res, error.message || 'Internal server error');
    }
};

/**
 * Create new project
 */
export const createProject = async (req: Request, res: Response) => {
    try {
        // Validate request body
        const validation = validateWithZod<ProjectCreateInput>(projectCreateSchema, req.body);
        
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        const projectData = validation.data!;

        // Check for duplicate project name
        const existingProject = await Project.findOne({
            where: {
                Project_Name: projectData.Project_Name.trim()
            }
        });

        if (existingProject) {
            return res.status(409).json({
                success: false,
                message: 'Project with this name already exists'
            });
        }

        // Prepare project data with additional fields
        const finalProjectData: any = {
            ...projectData,
            Project_Name: projectData.Project_Name.trim(),
            Project_Desc: projectData.Project_Desc ? projectData.Project_Desc.trim() : null,
            Company_Id: projectData.Company_Id || null,
            Project_Head: projectData.Project_Head || null,
            Project_Status: projectData.Project_Status || 1,
            Entry_By: (req as any).user?.id || 1,
            Entry_Date: new Date(),
            IsActive: projectData.IsActive || 1
        };

        const project = await Project.create(finalProjectData);
        
        // Format project with status text
        const formattedProject = formatProjectForResponse(project);
        
        return created(res, {
            success: true,
            message: 'Project created successfully',
            data: formattedProject
        });

    } catch (error: any) {
        console.error('Error creating project:', error);
        return servError(res, error.message || 'Internal server error');
    }
};

/**
 * Update project
 */
export const updateProject = async (req: Request, res: Response) => {
    try {
        // Validate ID parameter
        const idValidation = validateWithZod<{ id: number }>(projectIdSchema, { id: parseInt(req.params.id) });
        
        if (!idValidation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: idValidation.errors
            });
        }

        const { id } = idValidation.data!;

        // Validate request body
        const bodyValidation = validateWithZod<ProjectUpdateInput>(projectUpdateSchema, req.body);
        
        if (!bodyValidation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: bodyValidation.errors
            });
        }

        const updateData = bodyValidation.data!;

        const project = await Project.findByPk(id);
        
        if (!project) {
            return notFound(res, 'Project not found');
        }

        // Check for duplicate project name if Project_Name is being updated
        if (updateData.Project_Name && updateData.Project_Name !== project.Project_Name) {
            
            const existingProject = await Project.findOne({
                where: {
                    Project_Id: { [Op.ne]: id },
                    Project_Name: updateData.Project_Name.trim()
                }
            });

            if (existingProject) {
                return res.status(409).json({
                    success: false,
                    message: 'Another project with this name already exists'
                });
            }
        }

        // Prepare update data
        const finalUpdateData: any = {};
        if (updateData.Project_Name !== undefined) finalUpdateData.Project_Name = updateData.Project_Name.trim();
        if (updateData.Project_Desc !== undefined) finalUpdateData.Project_Desc = updateData.Project_Desc ? updateData.Project_Desc.trim() : null;
        if (updateData.Company_Id !== undefined) finalUpdateData.Company_Id = updateData.Company_Id;
        if (updateData.Project_Head !== undefined) finalUpdateData.Project_Head = updateData.Project_Head;
        if (updateData.Est_Start_Dt !== undefined) finalUpdateData.Est_Start_Dt = updateData.Est_Start_Dt;
        if (updateData.Est_End_Dt !== undefined) finalUpdateData.Est_End_Dt = updateData.Est_End_Dt;
        if (updateData.Project_Status !== undefined) finalUpdateData.Project_Status = updateData.Project_Status;
        if (updateData.IsActive !== undefined) finalUpdateData.IsActive = updateData.IsActive;
        
        // Add update metadata
        finalUpdateData.Update_By = (req as any).user?.id || 1;
        finalUpdateData.Update_Date = new Date();

        await project.update(finalUpdateData);
        
        const updatedProject = await Project.findByPk(id);
        
        if (!updatedProject) {
            return notFound(res, 'Project not found after update');
        }

        // Format project with status text
        const formattedProject = formatProjectForResponse(updatedProject);
        
        return updated(res, {
            success: true,
            message: 'Project updated successfully',
            data: formattedProject
        });

    } catch (error: any) {
        console.error('Error updating project:', error);
        return servError(res, error.message || 'Internal server error');
    }
};

/**
 * Delete project (soft delete)
 */
export const deleteProject = async (req: Request, res: Response) => {
    try {
        // Validate ID parameter
        const validation = validateWithZod<{ id: number }>(projectIdSchema, { id: parseInt(req.params.id) });
        
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        const { id } = validation.data!;

        const project = await Project.findByPk(id);
        
        if (!project) {
            return notFound(res, 'Project not found');
        }

        // Soft delete: Set IsActive to 0
        await project.update({
            IsActive: 0,
            Update_By: (req as any).user?.id || 1,
            Update_Date: new Date()
        });
        
        return res.status(200).json({
            success: true,
            message: 'Project deactivated successfully'
        });

    } catch (error: any) {
        console.error('Error deleting project:', error);
        return servError(res, error.message || 'Internal server error');
    }
};

/**
 * Get projects with no company
 */
export const getProjectsWithNoCompany = async (req: Request, res: Response) => {
    try {
        const projects = await Project.findAll({
            where: { 
                Company_Id: null,
                IsActive: 1 
            },
            order: [['Project_Name', 'ASC']]
        });

        // Format projects with status text
        const formattedProjects = projects.map(project => formatProjectForResponse(project));

        return res.status(200).json({
            success: true,
            message: 'Projects with no company retrieved successfully',
            data: formattedProjects
        });

    } catch (error: any) {
        console.error('Error fetching projects with no company:', error);
        return servError(res, error.message || 'Internal server error');
    }
};

/**
 * Get projects with no project head
 */
export const getProjectsWithNoProjectHead = async (req: Request, res: Response) => {
    try {
        const projects = await Project.findAll({
            where: { 
                Project_Head: null,
                IsActive: 1 
            },
            order: [['Project_Name', 'ASC']]
        });

        // Format projects with status text
        const formattedProjects = projects.map(project => formatProjectForResponse(project));

        return res.status(200).json({
            success: true,
            message: 'Projects with no project head retrieved successfully',
            data: formattedProjects
        });

    } catch (error: any) {
        console.error('Error fetching projects with no project head:', error);
        return servError(res, error.message || 'Internal server error');
    }
};

/**
 * Toggle project active status
 */
export const toggleProjectStatus = async (req: Request, res: Response) => {
    try {
        // Validate ID parameter
        const idValidation = validateWithZod<{ id: number }>(projectIdSchema, { id: parseInt(req.params.id) });
        
        if (!idValidation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: idValidation.errors
            });
        }

        const { id } = idValidation.data!;

        const project = await Project.findByPk(id);
        
        if (!project) {
            return notFound(res, 'Project not found');
        }

        // Toggle active status (1 to 0, 0 to 1)
        const newStatus = project.IsActive === 1 ? 0 : 1;
        
        await project.update({
            IsActive: newStatus,
            Update_By: (req as any).user?.id || 1,
            Update_Date: new Date()
        });

        const updatedProject = await Project.findByPk(id);
        
        if (!updatedProject) {
            return notFound(res, 'Project not found after update');
        }

        // Format project with status text
        const formattedProject = formatProjectForResponse(updatedProject);

        return updated(res, {
            success: true,
            message: `Project ${newStatus === 1 ? 'activated' : 'deactivated'} successfully`,
            data: formattedProject
        });

    } catch (error: any) {
        console.error('Error toggling project status:', error);
        return servError(res, error.message || 'Internal server error');
    }
};

/**
 * Get projects statistics
 */
export const getProjectStatistics = async (req: Request, res: Response) => {
    try {
        const totalProjects = await Project.count();
        const activeProjects = await Project.count({ where: { IsActive: 1 } });
        const inactiveProjects = await Project.count({ where: { IsActive: 0 } });
        
        // Count projects by status
        const statusCounts: any = {};
        const statusTextMap: any = {};
        for (let i = 0; i <= 5; i++) {
            const count = await Project.count({ where: { Project_Status: i, IsActive: 1 } });
            statusCounts[`status_${i}`] = count;
            statusTextMap[`status_${i}_text`] = getProjectStatusText(i);
        }

        // Count projects with no company
        const noCompanyCount = await Project.count({ 
            where: { 
                Company_Id: null,
                IsActive: 1 
            } 
        });

        // Count projects with no project head
        const noProjectHeadCount = await Project.count({ 
            where: { 
                Project_Head: null,
                IsActive: 1 
            } 
        });

        return res.status(200).json({
            success: true,
            message: 'Project statistics retrieved successfully',
            data: {
                totalProjects,
                activeProjects: {
                    count: activeProjects,
                    text: 'Active'
                },
                inactiveProjects: {
                    count: inactiveProjects,
                    text: 'Inactive'
                },
                statusCounts,
                statusTextMap,
                noCompanyCount,
                noProjectHeadCount
            }
        });

    } catch (error: any) {
        console.error('Error fetching project statistics:', error);
        return servError(res, error.message || 'Internal server error');
    }
};

/**
 * Get all status options for dropdown
 */
export const getStatusOptions = async (req: Request, res: Response) => {
    try {
        const activeStatusOptions = [
            { value: 1, label: 'Active' },
            { value: 0, label: 'Inactive' }
        ];

        const projectStatusOptions = [
            { value: 0, label: 'Not Started' },
            { value: 1, label: 'Planning' },
            { value: 2, label: 'In Progress' },
            { value: 3, label: 'On Hold' },
            { value: 4, label: 'Completed' },
            { value: 5, label: 'Cancelled' }
        ];

        return res.status(200).json({
            success: true,
            message: 'Status options retrieved successfully',
            data: {
                activeStatus: activeStatusOptions,
                projectStatus: projectStatusOptions
            }
        });

    } catch (error: any) {
        console.error('Error fetching status options:', error);
        return servError(res, error.message || 'Internal server error');
    }
};

/**
 * Hard delete project (permanent delete)
 */
export const hardDeleteProject = async (req: Request, res: Response) => {
    try {
        // Validate ID parameter
        const validation = validateWithZod<{ id: number }>(projectIdSchema, { id: parseInt(req.params.id) });
        
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        const { id } = validation.data!;

        const project = await Project.findByPk(id);
        
        if (!project) {
            return notFound(res, 'Project not found');
        }

        await project.destroy();
        
        return res.status(200).json({
            success: true,
            message: 'Project permanently deleted successfully'
        });

    } catch (error: any) {
        console.error('Error hard deleting project:', error);
        return servError(res, error.message || 'Internal server error');
    }
};

/**
 * Reactivate project
 */
export const reactivateProject = async (req: Request, res: Response) => {
    try {
        // Validate ID parameter
        const validation = validateWithZod<{ id: number }>(projectIdSchema, { id: parseInt(req.params.id) });
        
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        const { id } = validation.data!;

        const project = await Project.findByPk(id);
        
        if (!project) {
            return notFound(res, 'Project not found');
        }

        // Set project to active
        await project.update({
            IsActive: 1,
            Update_By: (req as any).user?.id || 1,
            Update_Date: new Date()
        });

        const updatedProject = await Project.findByPk(id);
        
        if (!updatedProject) {
            return notFound(res, 'Project not found after update');
        }

        // Format project with status text
        const formattedProject = formatProjectForResponse(updatedProject);

        return updated(res, {
            success: true,
            message: 'Project reactivated successfully',
            data: formattedProject
        });

    } catch (error: any) {
        console.error('Error reactivating project:', error);
        return servError(res, error.message || 'Internal server error');
    }
};