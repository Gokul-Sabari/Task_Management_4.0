import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../config/sequalizer';
import { z } from 'zod';

// Interface for Project attributes
export interface ProjectAttributes {
  Project_Id: number;
  Project_Name: string;
  Project_Desc?: string | null;
  Company_Id?: number | null;
  Project_Head: number | null;
  Est_Start_Dt: Date;
  Est_End_Dt: Date;
  Project_Status: number | null;
  Entry_By: number;
  Entry_Date: Date;
  Update_By?: number | null;
  Update_Date?: Date | null;
  IsActive?: number | null;
}

// Type for creation (Project_Id is optional as it's auto-generated)
export type ProjectCreationAttributes = Optional<ProjectAttributes, 'Project_Id'>;

// Zod schemas for validation
export const projectCreateSchema = z.object({
  Project_Name: z.string()
    .min(1, 'Project name is required')
    .max(255, 'Project name must be 255 characters or less')
    .trim(),
  Project_Desc: z.string()
    .max(1000, 'Project description must be 1000 characters or less')
    .trim()
    .optional()
    .nullable()
    .default(null),
  Company_Id: z.coerce.number()
    .int('Company ID must be an integer')
    .positive('Company ID must be positive')
    .optional()
    .nullable()
    .default(null),
  Project_Head: z.coerce.number()
    .int('Project head ID must be an integer')
    .positive('Project head ID must be positive')
    .optional()
    .nullable()
    .default(null),
  Est_Start_Dt: z.union([z.string(), z.date()])
    .transform(val => {
      if (typeof val === 'string') {
        const date = new Date(val);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date format');
        }
        return date;
      }
      return val;
    })
    .refine(val => val instanceof Date && !isNaN(val.getTime()), {
      message: 'Valid estimated start date is required',
    }),
  Est_End_Dt: z.union([z.string(), z.date()])
    .transform(val => {
      if (typeof val === 'string') {
        const date = new Date(val);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date format');
        }
        return date;
      }
      return val;
    })
    .refine(val => val instanceof Date && !isNaN(val.getTime()), {
      message: 'Valid estimated end date is required',
    }),
  Project_Status: z.coerce.number()
    .int('Project status must be an integer')
    .min(0, 'Project status must be 0 or greater')
    .max(5, 'Project status must be 5 or less')
    .optional()
    .nullable()
    .default(1),
  IsActive: z.union([z.boolean(), z.number(), z.string()])
    .transform(val => {
      if (typeof val === 'string') {
        if (val.toLowerCase() === 'true' || val === '1') return 1;
        if (val.toLowerCase() === 'false' || val === '0') return 0;
      }
      if (typeof val === 'number') return val;
      if (typeof val === 'boolean') return val ? 1 : 0;
      return 1;
    })
    .refine(val => val === 0 || val === 1, {
      message: 'IsActive must be 0 or 1',
    })
    .optional()
    .default(1),
}).refine(data => data.Est_End_Dt >= data.Est_Start_Dt, {
  message: 'End date must be after or equal to start date',
  path: ['Est_End_Dt'],
});

export const projectUpdateSchema = z.object({
  Project_Name: z.string()
    .min(1, 'Project name is required')
    .max(255, 'Project name must be 255 characters or less')
    .trim()
    .optional(),
  Project_Desc: z.string()
    .max(1000, 'Project description must be 1000 characters or less')
    .trim()
    .optional()
    .nullable()
    .default(null),
  Company_Id: z.coerce.number()
    .int('Company ID must be an integer')
    .positive('Company ID must be positive')
    .optional()
    .nullable()
    .default(null),
  Project_Head: z.coerce.number()
    .int('Project head ID must be an integer')
    .positive('Project head ID must be positive')
    .optional()
    .nullable()
    .default(null),
  Est_Start_Dt: z.union([z.string(), z.date()])
    .transform(val => {
      if (typeof val === 'string') {
        const date = new Date(val);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date format');
        }
        return date;
      }
      return val;
    })
    .refine(val => val instanceof Date && !isNaN(val.getTime()) || val === undefined, {
      message: 'Valid estimated start date is required',
    })
    .optional(),
  Est_End_Dt: z.union([z.string(), z.date()])
    .transform(val => {
      if (typeof val === 'string') {
        const date = new Date(val);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date format');
        }
        return date;
      }
      return val;
    })
    .refine(val => val instanceof Date && !isNaN(val.getTime()) || val === undefined, {
      message: 'Valid estimated end date is required',
    })
    .optional(),
  Project_Status: z.coerce.number()
    .int('Project status must be an integer')
    .min(0, 'Project status must be 0 or greater')
    .max(5, 'Project status must be 5 or less')
    .optional()
    .nullable()
    .default(null),
  IsActive: z.union([z.boolean(), z.number(), z.string()])
    .transform(val => {
      if (typeof val === 'string') {
        if (val.toLowerCase() === 'true' || val === '1') return 1;
        if (val.toLowerCase() === 'false' || val === '0') return 0;
      }
      if (typeof val === 'number') return val;
      if (typeof val === 'boolean') return val ? 1 : 0;
      return undefined;
    })
    .refine(val => val === undefined || val === 0 || val === 1, {
      message: 'IsActive must be 0 or 1',
    })
    .optional()
    .nullable(),
}).refine(data => {
  if (data.Est_Start_Dt && data.Est_End_Dt) {
    return data.Est_End_Dt >= data.Est_Start_Dt;
  }
  return true;
}, {
  message: 'End date must be after or equal to start date',
  path: ['Est_End_Dt'],
});

export const projectIdSchema = z.object({
  id: z.coerce.number()
    .int('Project ID must be an integer')
    .positive('Valid project ID is required')
});

export const projectQuerySchema = z.object({
  page: z.coerce.number()
    .int('Page must be an integer')
    .positive('Page must be positive')
    .default(1)
    .optional(),
  limit: z.coerce.number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20)
    .optional(),
  search: z.string()
    .optional()
    .nullable(),
  Project_Name: z.string()
    .optional()
    .nullable(),
  Company_Id: z.coerce.number()
    .int('Company ID must be an integer')
    .positive('Company ID must be positive')
    .optional()
    .nullable(),
  Project_Status: z.coerce.number()
    .int('Project status must be an integer')
    .min(0, 'Project status must be 0 or greater')
    .max(5, 'Project status must be 5 or less')
    .optional()
    .nullable(),
  Project_Head: z.coerce.number()
    .int('Project head ID must be an integer')
    .positive('Project head ID must be positive')
    .optional()
    .nullable(),
  IsActive: z.coerce.number()
    .int('IsActive must be an integer')
    .min(0, 'IsActive must be 0 or 1')
    .max(1, 'IsActive must be 0 or 1')
    .optional()
    .nullable(),
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  sortBy: z.enum([
    'Project_Id',
    'Project_Name',
    'Est_Start_Dt',
    'Est_End_Dt',
    'Entry_Date',
    'Update_Date',
    'IsActive',
    'Project_Status'
  ])
    .default('Project_Id')
    .optional(),
  sortOrder: z.enum(['ASC', 'DESC'])
    .default('DESC')
    .optional(),
});

// Type exports
export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
export type ProjectQueryParams = z.infer<typeof projectQuerySchema>;

// Helper functions for status conversion
export const getStatusText = (status: number | null): string => {
  if (status === 1) return 'Active';
  if (status === 0) return 'Inactive';
  return 'Unknown';
};

export const getProjectStatusText = (status: number | null): string => {
  const statusMap: Record<number, string> = {
    0: 'Not Started',
    1: 'Planning',
    2: 'In Progress',
    3: 'On Hold',
    4: 'Completed',
    5: 'Cancelled'
  };
  return status !== null && statusMap[status] ? statusMap[status] : 'Unknown';
};

// Function to format project for response
export const formatProjectForResponse = (project: any) => {
  const projectData = project.get ? project.get({ plain: true }) : project;
  
  return {
    ...projectData,
    statusText: getStatusText(projectData.IsActive),
    projectStatusText: getProjectStatusText(projectData.Project_Status)
  };
};

// Sequelize model
export class Project extends Model<ProjectAttributes, ProjectCreationAttributes>
  implements ProjectAttributes {
  public Project_Id!: number;
  public Project_Name!: string;
  public Project_Desc!: string | null;
  public Company_Id!: number | null;
  public Project_Head!: number | null;
  public Est_Start_Dt!: Date;
  public Est_End_Dt!: Date;
  public Project_Status!: number | null;
  public Entry_By!: number;
  public Entry_Date!: Date;
  public Update_By!: number | null;
  public Update_Date!: Date | null;
  public IsActive!: number | null;
}

Project.init(
  {
    Project_Id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'Project_Id'
    },
    Project_Name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'Project_Name'
    },
    Project_Desc: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      field: 'Project_Desc'
    },
    Company_Id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'Company_Id'
    },
    Project_Head: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'Project_Head'
    },
    Est_Start_Dt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'Est_Start_Dt'
    },
    Est_End_Dt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'Est_End_Dt'
    },
    Project_Status: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'Project_Status',
      defaultValue: 1
    },
    Entry_By: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'Entry_By',
      defaultValue: 1
    },
    Entry_Date: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'Entry_Date',
      defaultValue: DataTypes.NOW
    },
    Update_By: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'Update_By'
    },
    Update_Date: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'Update_Date'
    },
    IsActive: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'IsActive',
      defaultValue: 1
    }
  },
  {
    sequelize,
    tableName: 'tbl_Project_Master',
    modelName: 'Project',
    timestamps: false,
    hooks: {
      beforeUpdate: (project: Project) => {
        project.Update_Date = new Date();
      },
      beforeCreate: (project: Project) => {
        if (!project.Entry_Date) {
          project.Entry_Date = new Date();
        }
        if (project.IsActive === undefined || project.IsActive === null) {
          project.IsActive = 1;
        }
        if (project.Project_Status === undefined || project.Project_Status === null) {
          project.Project_Status = 1;
        }
      }
    }
  }
);

export default Project;