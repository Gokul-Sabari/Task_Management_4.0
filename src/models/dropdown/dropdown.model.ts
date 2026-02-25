import { Op, QueryTypes } from 'sequelize';
import { sequelize } from '../../config/sequalizer';
import { UserMaster } from '../masters/users/users.model';
import { Project } from '../masters/project/type.model'; 
import Company_Master from '../masters/companyMaster/type.model';

interface DropdownItem {
    value: string | number;
    label: string;
}

export const getProjectHeads = async (activeOnly: boolean = true): Promise<DropdownItem[]> => {
    try {
        const query = `
            SELECT DISTINCT
                pm.Project_Head AS value,
                u.name AS label
            FROM tbl_Project_Master pm
            INNER JOIN tbl_Users u ON pm.Project_Head = u.id
            WHERE pm.Project_Head IS NOT NULL
            AND u.name IS NOT NULL
            ${activeOnly ? 'AND u.isActive = 1 AND pm.IsActive = 1' : ''}
            ORDER BY u.name ASC
        `;
        
        const results = await sequelize.query<{ value: number; label: string }>(
            query,
            {
                type: QueryTypes.SELECT,
                raw: true
            }
        );
        
        // Filter out any null labels and ensure label is always a string
        return results
            .filter(row => row.label !== null && row.label !== undefined)
            .map(row => ({
                value: row.value,
                label: row.label || ''  // Fallback to empty string if somehow null
            }));
        
    } catch (error) {
        console.error('Error in getProjectHeads:', error);
        throw error;
    }
};

export const getProjectStatus = async (): Promise<DropdownItem[]> => {
    try {
        return [
            { value: 1, label: 'Active' },
            { value: 0, label: 'Inactive' }
        ];
    } catch (error) {
        console.error('Error in getProjectStatus:', error);
        throw error;
    }
};

export const getEmployees = async (activeOnly: boolean = true): Promise<DropdownItem[]> => {
    try {
        const whereCondition: any = {};
        
        if (activeOnly) {
            whereCondition.isActive = 1;
        }
        
        const users = await UserMaster.findAll({
            attributes: ['id', 'name'],
            where: whereCondition,
            order: [['name', 'ASC']]
        });
        
        return users
            .filter(user => user.name !== null && user.name !== undefined)
            .map(user => ({
                value: user.id,
                label: user.name || ''
            }));
        
    } catch (error) {
        console.error('Error in getEmployees:', error);
        throw error;
    }
};

export const searchEmployees = async (searchTerm: string, activeOnly: boolean = true): Promise<DropdownItem[]> => {
    try {
        const whereCondition: any = {
            name: {
                [Op.like]: `%${searchTerm}%`
            }
        };
        
        if (activeOnly) {
            whereCondition.isActive = 1;
        }
        
        const users = await UserMaster.findAll({
            attributes: ['id', 'name'],
            where: whereCondition,
            order: [['name', 'ASC']],
            limit: 50
        });
        
        return users
            .filter(user => user.name !== null && user.name !== undefined)
            .map(user => ({
                value: user.id,
                label: user.name || ''
            }));
        
    } catch (error) {
        console.error('Error in searchEmployees:', error);
        throw error;
    }
};

export const getTasks = async (activeOnly: boolean = true): Promise<DropdownItem[]> => {
    try {
        // Commented out until you have Task model
        // const whereCondition: any = {};
        
        // if (activeOnly) {
        //     whereCondition.isActive = 1;
        // }
        
        // const tasks = await Task.findAll({
        //     attributes: ['Task_Id', 'Task_Name'],
        //     where: whereCondition,
        //     order: [['Task_Name', 'ASC']]
        // });
        
        // return tasks.map(task => ({
        //     value: task.Task_Id,
        //     label: task.Task_Name
        // }));

        // Temporary: Return empty array or mock data
        return [];
        
    } catch (error) {
        console.error('Error in getTasks:', error);
        throw error;
    }
};

export const getProjects = async (activeOnly: boolean = true): Promise<DropdownItem[]> => {
    try {
        const whereCondition: any = {};
        
        if (activeOnly) {
            whereCondition.IsActive = 1;
            whereCondition.Project_Status = 1; // Active projects
        }
        
        const projects = await Project.findAll({
            attributes: ['Project_Id', 'Project_Name'],
            where: whereCondition,
            order: [['Project_Name', 'ASC']]
        });
        
        return projects
            .filter(project => project.Project_Name !== null && project.Project_Name !== undefined)
            .map(project => ({
                value: project.Project_Id,
                label: project.Project_Name || ''
            }));
        
    } catch (error) {
        console.error('Error in getProjects:', error);
        throw error;
    }
};

export const getAllDropdowns = async (activeOnly: boolean = true): Promise<{
    projectHeads: DropdownItem[];
    projectStatus: DropdownItem[];
    employees: DropdownItem[];
    tasks: DropdownItem[];
    projects: DropdownItem[]; 
}> => {
    try {
        const [projectHeads, projectStatus, employees, tasks, projects] = await Promise.all([
            getProjectHeads(activeOnly),
            getProjectStatus(),
            getEmployees(activeOnly),
            getTasks(activeOnly),
            getProjects(activeOnly) 
        ]);

        return {
            projectHeads,
            projectStatus,
            employees,
            tasks,
            projects
        };
        
    } catch (error) {
        console.error('Error in getAllDropdowns:', error);
        throw error;
    }
};

export const getCompany = async (activeOnly: boolean = true): Promise<DropdownItem[]> => {
    try {
        const projects = await Company_Master.findAll({
            order: [['Company_id', 'ASC']]
        });
        
        return projects
            .filter(project => project.Company_Name !== null && project.Company_Name !== undefined)
            .map(project => ({
                value: project.Company_id,
                label: project.Company_Name || ''
            }));
        
    } catch (error) {
        console.error('Error in getProjects:', error);
        throw error;
    }
};

export default {
    getProjectHeads,
    getProjectStatus,
    getEmployees,
    searchEmployees,
    getTasks,
    getProjects,
    getAllDropdowns,
    getCompany
};