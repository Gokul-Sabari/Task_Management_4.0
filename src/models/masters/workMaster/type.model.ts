import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../config/sequalizer';
import { z } from "zod";

const modelName = 'WorkMaster';

export interface WorkMasterAttributes {
    SNo: number;
    Work_Id: number;
    Sch_Id: number;
    Task_Id: number;
    Emp_Id: number;
    Work_Dt: Date;
    Work_Done?: string | null;
    Start_Time?: Date | null;
    End_Time?: Date | null;
    Tot_Minutes?: number | null;
    Work_Status?: string | null;
    Entry_By?: number | null;
    Entry_Date?: Date | null;
    Update_By?: number | null;
    Update_Date?: Date | null;
    Process_Id?: number | null;
}

type WorkMasterCreationAttributes = Optional<WorkMasterAttributes, 'SNo' | 'Entry_Date' | 'Update_Date' | 'Update_By'>;

export class WorkMaster
    extends Model<WorkMasterAttributes, WorkMasterCreationAttributes>
    implements WorkMasterAttributes {

    declare SNo: number;
    declare Work_Id: number;
    declare Sch_Id: number;
    declare Task_Id: number;
    declare Emp_Id: number;
    declare Work_Dt: Date;
    declare Work_Done: string | null;
    declare Start_Time: Date | null;
    declare End_Time: Date | null;
    declare Tot_Minutes: number | null;
    declare Work_Status: string | null;
    declare Entry_By: number | null;
    declare Entry_Date: Date | null;
    declare Update_By: number | null;
    declare Update_Date: Date | null;
    declare Process_Id: number | null;

    // For TypeScript - parameters will be added via association
    public readonly parameters?: any[];
}

// Parameter Schema for nested validation
export const workParameterSchema = z.object({
    Param_Id: z.number(),
    Default_Value: z.string().optional().nullable(),
    Current_Value: z.string().optional().nullable()
});

// Create Schema
export const workMasterCreateSchema = z.object({
    Work_Id: z.number(),
    Sch_Id: z.number(),
    Task_Id: z.number(),
    Emp_Id: z.number(),
    Work_Dt: z.union([z.string(), z.date()]).transform(val => new Date(val)),
    Work_Done: z.string().optional().nullable(),
    Start_Time: z.union([z.string(), z.date()]).optional().nullable().transform(val => val ? new Date(val) : null),
    End_Time: z.union([z.string(), z.date()]).optional().nullable().transform(val => val ? new Date(val) : null),
    Tot_Minutes: z.number().optional().nullable(),
    Work_Status: z.string().optional().nullable(),
    Entry_By: z.number().optional().nullable(),
    Process_Id: z.number().optional().nullable(),
    Parameters: z.array(workParameterSchema).optional().default([])
});

// Update Schema
export const workMasterUpdateSchema = z.object({
    Work_Id: z.number().optional(),
    Sch_Id: z.number().optional(),
    Task_Id: z.number().optional(),
    Emp_Id: z.number().optional(),
    Work_Dt: z.union([z.string(), z.date()]).optional().transform(val => val ? new Date(val) : null),
    Work_Done: z.string().optional().nullable(),
    Start_Time: z.union([z.string(), z.date()]).optional().nullable().transform(val => val ? new Date(val) : null),
    End_Time: z.union([z.string(), z.date()]).optional().nullable().transform(val => val ? new Date(val) : null),
    Tot_Minutes: z.number().optional().nullable(),
    Work_Status: z.string().optional().nullable(),
    Update_By: z.number().optional().nullable(),
    Process_Id: z.number().optional().nullable(),
    Parameters: z.array(workParameterSchema).optional()
});

// ID Schema for params
export const workMasterIdSchema = z.object({
    id: z.union([z.string(), z.number()]).transform(val => Number(val))
});

// List Query Schema
export const workMasterListQuerySchema = z.object({
    page: z.string().optional().transform(val => (val ? parseInt(val) : 1)),
    limit: z.string().optional().transform(val => (val ? parseInt(val) : 10)),
    search: z.string().optional(),
    empId: z.string().optional().transform(val => (val ? parseInt(val) : undefined)),
    taskId: z.string().optional().transform(val => (val ? parseInt(val) : undefined)),
    schId: z.string().optional().transform(val => (val ? parseInt(val) : undefined)),
    fromDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
    toDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
    workStatus: z.string().optional()
});

// Export Types
export type WorkMasterCreateInput = z.infer<typeof workMasterCreateSchema>;
export type WorkMasterUpdateInput = z.infer<typeof workMasterUpdateSchema>;
export type WorkMasterListQuery = z.infer<typeof workMasterListQuerySchema>;
export type WorkParameterInput = z.infer<typeof workParameterSchema>;

WorkMaster.init(
    {
        SNo: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        Work_Id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            unique: true,
        },
        Sch_Id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        Task_Id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        Emp_Id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        Work_Dt: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        Work_Done: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        Start_Time: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        End_Time: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        Tot_Minutes: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        Work_Status: {
            type: DataTypes.STRING(50),
            allowNull: true,
            defaultValue: 'Pending'
        },
        Entry_By: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        Entry_Date: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
        },
        Update_By: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        Update_Date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        Process_Id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'tbl_Work_Master',
        modelName: modelName,
        timestamps: false,
        freezeTableName: true,
    }
);

export const workMasterAccKey = {
    SNo: `${modelName}.SNo`,
    Work_Id: `${modelName}.Work_Id`,
    Sch_Id: `${modelName}.Sch_Id`,
    Task_Id: `${modelName}.Task_Id`,
    Emp_Id: `${modelName}.Emp_Id`,
    Work_Dt: `${modelName}.Work_Dt`,
    Work_Done: `${modelName}.Work_Done`,
    Start_Time: `${modelName}.Start_Time`,
    End_Time: `${modelName}.End_Time`,
    Tot_Minutes: `${modelName}.Tot_Minutes`,
    Work_Status: `${modelName}.Work_Status`,
    Entry_By: `${modelName}.Entry_By`,
    Entry_Date: `${modelName}.Entry_Date`,
    Update_By: `${modelName}.Update_By`,
    Update_Date: `${modelName}.Update_Date`,
    Process_Id: `${modelName}.Process_Id`,
}