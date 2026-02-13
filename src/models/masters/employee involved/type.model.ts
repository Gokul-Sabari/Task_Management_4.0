// models/masters/employee involved/type.model.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../config/sequalizer';
import { z } from 'zod';
import Project from '../project/type.model';
import Employee from '../employee/type.model';

const modelName = 'ProjectEmployee';

export interface ProjectEmployeeAttributes {
    Employee_Id: number;
    Project_Id: number | null;
    Emp_Id: number | null;
    Del_Flag: number;
    project?: any;
    employee?: any;
}

type ProjectEmployeeCreationAttributes = Optional<ProjectEmployeeAttributes, 'Employee_Id'>;

export class ProjectEmployee extends Model<ProjectEmployeeAttributes, ProjectEmployeeCreationAttributes> 
    implements ProjectEmployeeAttributes {
    public Employee_Id!: number;
    public Project_Id!: number | null;
    public Emp_Id!: number | null;
    public Del_Flag!: number;
    public project?: any;
    public employee?: any;
}

// Zod schemas for validation
export const ProjectEmployeeCreationSchema = z.object({
    Project_Id: z.coerce.number()
        .int()
        .positive('Project ID must be positive')
        .nullable(),

    Emp_Id: z.coerce.number()
        .int()
        .positive('Employee ID must be positive')
        .nullable(),
});

// BULK CREATE Schema
export const ProjectEmployeeBulkCreateSchema = z.object({
    Project_Id: z.coerce.number()
        .int()
        .positive('Project ID must be positive'),
    
    Emp_Ids: z.array(
        z.coerce.number()
            .int()
            .positive('Employee ID must be positive')
    ).min(1, 'At least one employee must be selected')
});

export const ProjectEmployeeUpdateSchema = z.object({
    Project_Id: z.coerce.number()
        .int()
        .positive('Project ID must be positive')
        .nullable()
        .optional(),

    Emp_Id: z.coerce.number()
        .int()
        .positive('Employee ID must be positive')
        .nullable()
        .optional(),

    Del_Flag: z.coerce.number()
        .int()
        .min(0)
        .max(1)
        .optional()
});

// BULK UPDATE Schema
export const ProjectEmployeeBulkUpdateSchema = z.object({
    Project_Id: z.coerce.number()
        .int()
        .positive('Project ID must be positive'),
    
    Emp_Ids: z.array(
        z.coerce.number()
            .int()
            .positive('Employee ID must be positive')
    )
});

export const ProjectEmployeeQuerySchema = z.object({
    page: z.coerce.number()
        .int()
        .positive('Page must be positive')
        .default(1)
        .optional(),
    limit: z.coerce.number()
        .int()
        .min(1, 'Limit must be at least 1')
        .max(500, 'Limit cannot exceed 500')
        .default(50)
        .optional(),
    search: z.string().optional(),
    Project_Id: z.coerce.number()
        .int()
        .positive('Project ID must be positive')
        .optional(),
    Emp_Id: z.coerce.number()
        .int()
        .positive('Employee ID must be positive')
        .optional(),
    sortBy: z.string()
        .optional()
        .default('Project_Id'),
    sortOrder: z.enum(['ASC', 'DESC'])
        .optional()
        .default('ASC')
});

export const ProjectEmployeeIdSchema = z.object({
    id: z.coerce.number()
        .int()
        .positive('Valid ID is required')
});

export const ProjectIdSchema = z.object({
    projectId: z.coerce.number()
        .int()
        .positive('Valid Project ID is required')
});

// TypeScript types from Zod schemas
export type ProjectEmployeeCreate = z.infer<typeof ProjectEmployeeCreationSchema>;
export type ProjectEmployeeBulkCreate = z.infer<typeof ProjectEmployeeBulkCreateSchema>;
export type ProjectEmployeeUpdate = z.infer<typeof ProjectEmployeeUpdateSchema>;
export type ProjectEmployeeBulkUpdate = z.infer<typeof ProjectEmployeeBulkUpdateSchema>;
export type ProjectEmployeeQuery = z.infer<typeof ProjectEmployeeQuerySchema>;

// Initialize the model
ProjectEmployee.init(
    {
        Employee_Id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            field: 'Employee_Id'
        },
        Project_Id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'Project_Id'
        },
        Emp_Id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'Emp_Id'
        },
        Del_Flag: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: 'Del_Flag'
        }
    },
    {
        sequelize,
        tableName: 'tbl_Project_Employee',
        modelName: modelName,
        timestamps: false,
        freezeTableName: true
    }
);

// Define associations HERE - THIS IS CRITICAL
ProjectEmployee.belongsTo(Project, {
    foreignKey: 'Project_Id',
    targetKey: 'Project_Id',
    as: 'project'
});

ProjectEmployee.belongsTo(Employee, {
    foreignKey: 'Emp_Id',
    targetKey: 'Emp_Id',
    as: 'employee'
});

export default ProjectEmployee;