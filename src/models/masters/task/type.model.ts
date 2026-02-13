import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../config/sequalizer';
import { z } from 'zod';

// Interface for Task attributes
export interface TaskAttributes {
  Task_Id: number;
  Task_Name: string;
  Task_Desc?: string | null;
 Company_Id?: number | null;
  Task_Type_Id: number;
  Entry_By: number;
  Entry_Date: Date;
  Update_By?: number | null;
  Update_Date?: Date | null;
  Project_Id?: number | null;
  
}

export type TaskCreationAttributes = Optional<TaskAttributes, 'Task_Id'>;

// Zod schemas for validation
export const taskCreateSchema = z.object({
  Task_Name: z.string().min(1, 'Task name is required').max(255, 'Task name must be 255 characters or less'),
  Task_Desc: z.string().optional().nullable(),
  Company_Id: z.number().optional().nullable(),
 Task_Type_Id: z.number().min(1, 'Valid task group ID is required'),
  Project_Id: z.number().optional().nullable(),
  
});

export const taskUpdateSchema = z.object({
  Task_Name: z.string().min(1, 'Task name is required').max(255, 'Task name must be 255 characters or less').optional(),
  Task_Desc: z.string().optional().nullable(),
  Company_Id: z.number().optional().nullable(),
  Task_Type_Id: z.number().min(1, 'Valid task group ID is required').optional(),
  Project_Id: z.number().optional().nullable(),
  
});

export const taskIdSchema = z.object({
  id: z.coerce.number().min(1, 'Valid task ID is required')
});

export const taskQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  Company_Id: z.coerce.number().int().positive().nullable().optional(),
  Task_Type_Id: z.coerce.number().int().positive().optional(),
  Project_Id: z.coerce.number().int().positive().nullable().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['Task_Id', 'Task_Name', 'Entry_Date', 'Update_Date', 'Task_Type_Id']).default('Task_Id').optional(),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC').optional(),
});

// Type exports
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
export type TaskQueryParams = z.infer<typeof taskQuerySchema>;

// Sequelize model
export class Task extends Model<TaskAttributes, TaskCreationAttributes>
  implements TaskAttributes {
  public Task_Id!: number;
  public Task_Name!: string;
  public Task_Desc!: string | null;
  public Company_Id!: number | null;
  public Task_Type_Id!: number;
  public Entry_By!: number;
  public Entry_Date!: Date;
  public Update_By!: number | null;
  public Update_Date!: Date | null;
  public Project_Id!: number | null;
  // public Task_Type_Id!: number | null; // Add this if your table has this column
}

Task.init(
  {
    Task_Id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    Task_Name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    Task_Desc: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    Company_Id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    Task_Type_Id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    // Task_Type_Id: { // Add this if your table has this column
    //   type: DataTypes.INTEGER,
    //   allowNull: true
    // },
    Entry_By: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    Entry_Date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    Update_By: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    Update_Date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    Project_Id: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'tbl_Task',
    timestamps: false,
    hooks: {
      beforeUpdate: (task: Task) => {
        task.Update_Date = new Date();
      }
    }
  }
);