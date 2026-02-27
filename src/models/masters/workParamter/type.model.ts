import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../config/sequalizer';
import { z } from "zod";

const modelName = 'WorkParameter';

export interface WorkParameterAttributes {
    WNo: number;
    Work_Id: number;
    Task_Id: number;
    Param_Id: number;
    Default_Value?: string | null;
    Current_Value?: string | null;
}

type WorkParameterCreationAttributes = Optional<WorkParameterAttributes, 'WNo'>;

export class WorkParameter
    extends Model<WorkParameterAttributes, WorkParameterCreationAttributes>
    implements WorkParameterAttributes {

    declare WNo: number;
    declare Work_Id: number;
    declare Task_Id: number;
    declare Param_Id: number;
    declare Default_Value: string | null;
    declare Current_Value: string | null;
}

// Create Schema
export const workParameterCreateSchema = z.object({
    Work_Id: z.number(),
    Task_Id: z.number(),
    Param_Id: z.number(),
    Default_Value: z.string().optional().nullable(),
    Current_Value: z.string().optional().nullable()
});

// Update Schema
export const workParameterUpdateSchema = z.object({
    Work_Id: z.number().optional(),
    Task_Id: z.number().optional(),
    Param_Id: z.number().optional(),
    Default_Value: z.string().optional().nullable(),
    Current_Value: z.string().optional().nullable()
});

// ID Schema
export const workParameterIdSchema = z.object({
    id: z.union([z.string(), z.number()]).transform(val => Number(val))
});

// List Query Schema
export const workParameterListQuerySchema = z.object({
    page: z.string().optional().transform(val => (val ? parseInt(val) : 1)),
    limit: z.string().optional().transform(val => (val ? parseInt(val) : 10)),
    search: z.string().optional(),
    workId: z.string().optional().transform(val => (val ? parseInt(val) : undefined)),
    taskId: z.string().optional().transform(val => (val ? parseInt(val) : undefined)),
    paramId: z.string().optional().transform(val => (val ? parseInt(val) : undefined))
});

// Export Types
export type WorkParameterCreateInput = z.infer<typeof workParameterCreateSchema>;
export type WorkParameterUpdateInput = z.infer<typeof workParameterUpdateSchema>;
export type WorkParameterListQuery = z.infer<typeof workParameterListQuerySchema>;

WorkParameter.init(
    {
        WNo: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        Work_Id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'tbl_Work_Master', // String reference to avoid circular dependency
                key: 'Work_Id'
            }
        },
        Task_Id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        Param_Id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        Default_Value: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        Current_Value: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'tbl_Work_Paramet_DT',
        modelName: modelName,
        timestamps: false,
        freezeTableName: true,
    }
);

export const workParameterAccKey = {
    WNo: `${modelName}.WNo`,
    Work_Id: `${modelName}.Work_Id`,
    Task_Id: `${modelName}.Task_Id`,
    Param_Id: `${modelName}.Param_Id`,
    Default_Value: `${modelName}.Default_Value`,
    Current_Value: `${modelName}.Current_Value`,
}