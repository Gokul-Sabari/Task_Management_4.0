import { DataTypes, Model, Optional, QueryTypes } from 'sequelize'; // Import QueryTypes
import { sequelize } from '../../../config/sequalizer';
import { z } from 'zod';

const modelName = 'Process_Master';

export interface ProcessMasterAttributes {
    Id: number;
    Process_Name: string;
}

type ProcessMasterCreationAttributes = ProcessMasterAttributes; // BOTH fields required if no IDENTITY

export class Process_Master
    extends Model<ProcessMasterAttributes, ProcessMasterCreationAttributes>
    implements ProcessMasterAttributes {

    declare Id: number;
    declare Process_Name: string;

    // Add this method to get next available ID
    static async getNextId(): Promise<number> {
        try {
            const result = await sequelize.query(
                'SELECT ISNULL(MAX(Id), 0) + 1 as nextId FROM tbl_Process_Master',
                { 
                    type: QueryTypes.SELECT, // Use imported QueryTypes
                    raw: true 
                }
            ) as any[];
            
            return result[0]?.nextId || 1;
        } catch (error) {
            console.error('Error getting next ID:', error);
            throw error;
        }
    }
}

// Zod schemas - For API request validation (client doesn't send Id)
export const processMasterCreateSchema = z.object({
    Process_Name: z.string()
        .min(1, 'Process name is required')
        .max(250, 'Process name cannot exceed 250 characters')
        .trim()
});

export const processMasterUpdateSchema = z.object({
    Process_Name: z.string()
        .min(1, 'Process name is required')
        .max(250, 'Process name cannot exceed 250 characters')
        .trim()
});

export const processMasterQuerySchema = z.object({
    page: z.coerce.number()
        .int()
        .positive()
        .default(1),
    limit: z.coerce.number()
        .int()
        .min(1)
        .max(100)
        .default(20),
    search: z.string().optional(),
    sortBy: z.enum(['Id', 'Process_Name'])
        .default('Id'),
    sortOrder: z.enum(['ASC', 'DESC'])
        .default('ASC')
});

export const processMasterIdSchema = z.object({
    id: z.coerce.number()
        .int()
        .positive('Valid ID is required')
});

export type ProcessMasterCreateInput = z.infer<typeof processMasterCreateSchema>;
export type ProcessMasterUpdateInput = z.infer<typeof processMasterUpdateSchema>;
export type ProcessMasterQueryParams = z.infer<typeof processMasterQuerySchema>;

// Initialize the model
Process_Master.init(
    {
        Id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            field: 'Id',
            allowNull: false,
            autoIncrement: true // Keep this true for Sequelize behavior
        },
        Process_Name: {
            type: DataTypes.STRING(250),
            allowNull: false,
            field: 'Process_Name',
            validate: {
                notEmpty: true
            }
        }
    },
    {
        sequelize,
        tableName: 'tbl_Process_Master',
        modelName: modelName,
        timestamps: false,
        freezeTableName: true,
        // Add this for MSSQL without IDENTITY
        hooks: {
            beforeCreate: async (process: Process_Master) => {
                // Only generate ID if not provided
                if (!process.Id) {
                    const nextId = await Process_Master.getNextId();
                    process.Id = nextId;
                }
            }
        }
    }
);

export const processMasterAccKey = {
    Id: `${modelName}.Id`,
    Process_Name: `${modelName}.Process_Name`
};