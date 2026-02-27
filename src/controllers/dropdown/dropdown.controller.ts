import { Request, Response } from 'express';
import dropdownModel from '../../models/dropdown/dropdown.model';

interface DropdownItem {
    value: string | number;
    label: string;
}

interface ApiResponse {
    success: boolean;
    message: string;
    data?: any;
    count?: number;
    error?: string;
    timestamp: string;
}

interface DropdownRequest extends Request {
    query: {
        search?: string;
        activeOnly?: string;
        [key: string]: any;
    }
}

// ==================== EXISTING FUNCTIONS ====================

export const getProjectHeadDropdown = async (req: DropdownRequest, res: Response): Promise<void> => {
    try {
        const activeOnly = req.query.activeOnly !== 'false';
        const data = await dropdownModel.getProjectHeads(activeOnly);
        
        const response: ApiResponse = {
            success: true,
            message: 'Project heads retrieved successfully',
            data,
            count: data.length,
            timestamp: new Date().toISOString()
        };
        
        res.status(200).json(response);
        
    } catch (error) {
        console.error('Error in getProjectHeadDropdown:', error);
        
        const response: ApiResponse = {
            success: false,
            message: 'Failed to retrieve project heads',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        };
        
        res.status(500).json(response);
    }
};

export const getProjectStatusDropdown = async (req: DropdownRequest, res: Response): Promise<void> => {
    try {
        const data = await dropdownModel.getProjectStatus();
        
        const response: ApiResponse = {
            success: true,
            message: 'Project status options retrieved successfully',
            data,
            count: data.length,
            timestamp: new Date().toISOString()
        };
        
        res.status(200).json(response);
        
    } catch (error) {
        console.error('Error in getProjectStatusDropdown:', error);
        
        const response: ApiResponse = {
            success: false,
            message: 'Failed to retrieve project status options',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        };
        
        res.status(500).json(response);
    }
};

export const getEmployeeDropdown = async (req: DropdownRequest, res: Response): Promise<void> => {
    try {
        const activeOnly = req.query.activeOnly !== 'false';
        const data = await dropdownModel.getEmployees(activeOnly);
        
        const response: ApiResponse = {
            success: true,
            message: 'Employees retrieved successfully',
            data,
            count: data.length,
            timestamp: new Date().toISOString()
        };
        
        res.status(200).json(response);
        
    } catch (error) {
        console.error('Error in getEmployeeDropdown:', error);
        
        const response: ApiResponse = {
            success: false,
            message: 'Failed to retrieve employees',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        };
        
        res.status(500).json(response);
    }
};

export const searchEmployees = async (req: DropdownRequest, res: Response): Promise<void> => {
    try {
        const { search, activeOnly = 'true' } = req.query;
        
        if (!search || typeof search !== 'string') {
            const response: ApiResponse = {
                success: false,
                message: 'Search term is required',
                timestamp: new Date().toISOString()
            };
            res.status(400).json(response);
            return;
        }
        
        if (search.length < 2) {
            const response: ApiResponse = {
                success: false,
                message: 'Search term must be at least 2 characters',
                timestamp: new Date().toISOString()
            };
            res.status(400).json(response);
            return;
        }
        
        const data = await dropdownModel.searchEmployees(search, activeOnly !== 'false');
        
        const response: ApiResponse = {
            success: true,
            message: 'Employees search completed successfully',
            data,
            count: data.length,
            timestamp: new Date().toISOString()
        };
        
        res.status(200).json(response);
        
    } catch (error) {
        console.error('Error in searchEmployees:', error);
        
        const response: ApiResponse = {
            success: false,
            message: 'Failed to search employees',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        };
        
        res.status(500).json(response);
    }
};

export const getTaskDropdown = async (req: DropdownRequest, res: Response): Promise<void> => {
    try {
        const activeOnly = req.query.activeOnly !== 'false';
        const data = await dropdownModel.getTasks(activeOnly);
        
        const response: ApiResponse = {
            success: true,
            message: 'Tasks retrieved successfully',
            data,
            count: data.length,
            timestamp: new Date().toISOString()
        };
        
        res.status(200).json(response);
        
    } catch (error) {
        console.error('Error in getTaskDropdown:', error);
        
        const response: ApiResponse = {
            success: false,
            message: 'Failed to retrieve tasks',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        };
        
        res.status(500).json(response);
    }
};

export const getProjectsDropdown = async (req: DropdownRequest, res: Response): Promise<void> => {
    try {
        const activeOnly = req.query.activeOnly !== 'false';
        const data = await (dropdownModel as any).getProjects?.(activeOnly) || [];
        
        const response: ApiResponse = {
            success: true,
            message: 'Projects retrieved successfully',
            data,
            count: data.length,
            timestamp: new Date().toISOString()
        };
        
        res.status(200).json(response);
        
    } catch (error) {
        console.error('Error in getProjectsDropdown:', error);
        
        const response: ApiResponse = {
            success: false,
            message: 'Failed to retrieve projects',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        };
        
        res.status(500).json(response);
    }
};

export const getAllDropdowns = async (req: DropdownRequest, res: Response): Promise<void> => {
    try {
        const activeOnly = req.query.activeOnly !== 'false';
        const data = await dropdownModel.getAllDropdowns(activeOnly);
        
        const response: ApiResponse = {
            success: true,
            message: 'All dropdowns retrieved successfully',
            data,
            timestamp: new Date().toISOString()
        };
        
        res.status(200).json(response);
        
    } catch (error) {
        console.error('Error in getAllDropdowns:', error);
        
        const response: ApiResponse = {
            success: false,
            message: 'Failed to retrieve dropdowns',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        };
        
        res.status(500).json(response);
    }
};

export const getCompany = async (req: DropdownRequest, res: Response): Promise<void> => {
    try {
        const activeOnly = req.query.activeOnly !== 'false';
        const data = await (dropdownModel as any).getCompany?.(activeOnly) || [];
        
        const response: ApiResponse = {
            success: true,
            message: 'Company retrieved successfully',
            data,
            count: data.length,
            timestamp: new Date().toISOString()
        };
        
        res.status(200).json(response);
        
    } catch (error) {
        console.error('Error in getCompany:', error);
        
        const response: ApiResponse = {
            success: false,
            message: 'Failed to retrieve company',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        };
        
        res.status(500).json(response);
    }
};

// ==================== NEW SALES PERSON FUNCTIONS ====================

export const getSalesPersonsDropdown = async (req: DropdownRequest, res: Response): Promise<void> => {
    try {
        const activeOnly = req.query.activeOnly !== 'false';
        const search = req.query.search as string || '';
        
        // Direct SQL query instead of using model
        let query = `
            SELECT 
                u.id as value,
                u.name as label,
                u.uniqueName,
                u.userType,
              
                u.isActive
            FROM 
                tbl_Users u
          
            WHERE 
                u.userType = 6
        `;

        const replacements: any = {};

        if (activeOnly) {
            query += ` AND u.isActive = 1`;
        }

      

        query += ` ORDER BY u.name ASC`;

        const { sequelize } = require('../../config/sequalizer');
        const { QueryTypes } = require('sequelize');
        
        const data = await sequelize.query(query, {
            replacements: Object.keys(replacements).length > 0 ? replacements : undefined,
            type: QueryTypes.SELECT
        });
        
        const response: ApiResponse = {
            success: true,
            message: 'Sales persons retrieved successfully',
            data,
            count: data.length,
            timestamp: new Date().toISOString()
        };
        
        res.status(200).json(response);
        
    } catch (error) {
        console.error('Error in getSalesPersonsDropdown:', error);
        
        const response: ApiResponse = {
            success: false,
            message: 'Failed to retrieve sales persons',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        };
        
        res.status(500).json(response);
    }
};

export const getActiveSalesPersonsDropdown = async (req: DropdownRequest, res: Response): Promise<void> => {
    try {
        const data = await (dropdownModel as any).getActiveSalesPersons?.() || [];
        
        const response: ApiResponse = {
            success: true,
            message: 'Active sales persons retrieved successfully',
            data,
            count: data.length,
            timestamp: new Date().toISOString()
        };
        
        res.status(200).json(response);
        
    } catch (error) {
        console.error('Error in getActiveSalesPersonsDropdown:', error);
        
        const response: ApiResponse = {
            success: false,
            message: 'Failed to retrieve active sales persons',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        };
        
        res.status(500).json(response);
    }
};

export const searchSalesPersons = async (req: DropdownRequest, res: Response): Promise<void> => {
    try {
        const { search, activeOnly = 'true' } = req.query;
        
        if (!search || typeof search !== 'string') {
            const response: ApiResponse = {
                success: false,
                message: 'Search term is required',
                timestamp: new Date().toISOString()
            };
            res.status(400).json(response);
            return;
        }
        
        if (search.length < 2) {
            const response: ApiResponse = {
                success: false,
                message: 'Search term must be at least 2 characters',
                timestamp: new Date().toISOString()
            };
            res.status(400).json(response);
            return;
        }
        
        const data = await (dropdownModel as any).searchSalesPersons?.(search, activeOnly !== 'false') || [];
        
        const response: ApiResponse = {
            success: true,
            message: 'Sales persons search completed successfully',
            data,
            count: data.length,
            timestamp: new Date().toISOString()
        };
        
        res.status(200).json(response);
        
    } catch (error) {
        console.error('Error in searchSalesPersons:', error);
        
        const response: ApiResponse = {
            success: false,
            message: 'Failed to search sales persons',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        };
        
        res.status(500).json(response);
    }
};

export const getSalesPersonsByBranchDropdown = async (req: DropdownRequest, res: Response): Promise<void> => {
    try {
        const { branchId } = req.params;
        const activeOnly = req.query.activeOnly !== 'false';
        
        if (!branchId) {
            const response: ApiResponse = {
                success: false,
                message: 'Branch ID is required',
                timestamp: new Date().toISOString()
            };
            res.status(400).json(response);
            return;
        }
        
        const data = await (dropdownModel as any).getSalesPersonsByBranch?.(Number(branchId), activeOnly) || [];
        
        const response: ApiResponse = {
            success: true,
            message: 'Sales persons by branch retrieved successfully',
            data,
            count: data.length,
            timestamp: new Date().toISOString()
        };
        
        res.status(200).json(response);
        
    } catch (error) {
        console.error('Error in getSalesPersonsByBranchDropdown:', error);
        
        const response: ApiResponse = {
            success: false,
            message: 'Failed to retrieve sales persons by branch',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        };
        
        res.status(500).json(response);
    }
};

// ==================== EXPORTS ====================

export default {
    getProjectHeadDropdown,
    getProjectStatusDropdown,
    getEmployeeDropdown,
    searchEmployees,
    getTaskDropdown,
    getProjectsDropdown,
    getAllDropdowns,
    getCompany,
    // Add new sales person functions
    getSalesPersonsDropdown,
    getActiveSalesPersonsDropdown,
    searchSalesPersons,
    getSalesPersonsByBranchDropdown
};