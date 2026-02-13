import { DataTypes, Model, QueryTypes } from 'sequelize';
import { sequelize } from '../../../config/sequalizer';
import { z } from 'zod';

const modelName = 'LeaveType';

export interface LeaveTypeAttributes {
    Id: number;
    LeaveType: string;
}

type LeaveTypeCreationAttributes = LeaveTypeAttributes; // Both fields required

export class LeaveType
    extends Model<LeaveTypeAttributes, LeaveTypeCreationAttributes>
    implements LeaveTypeAttributes {

    declare Id: number;
    declare LeaveType: string;

    // Method to get next available ID
    static async getNextId(): Promise<number> {
        try {
            const result = await sequelize.query(
                'SELECT ISNULL(MAX(Id), 0) + 1 as nextId FROM tbl_LeaveType',
                { 
                    type: QueryTypes.SELECT,
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

// Zod schemas
export const leaveTypeCreateSchema = z.object({
    LeaveType: z.string()
        .min(1, 'Leave type is required')
        .max(100, 'Leave type cannot exceed 100 characters')
        .trim()
});

export const leaveTypeUpdateSchema = z.object({
    LeaveType: z.string()
        .min(1, 'Leave type is required')
        .max(100, 'Leave type cannot exceed 100 characters')
        .trim()
});

export const leaveTypeQuerySchema = z.object({
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
    sortBy: z.enum(['Id', 'LeaveType'])
        .default('Id'),
    sortOrder: z.enum(['ASC', 'DESC'])
        .default('ASC')
});

export const leaveTypeIdSchema = z.object({
    id: z.coerce.number()
        .int()
        .positive('Valid ID is required')
});

export type LeaveTypeCreateInput = z.infer<typeof leaveTypeCreateSchema>;
export type LeaveTypeUpdateInput = z.infer<typeof leaveTypeUpdateSchema>;
export type LeaveTypeQueryParams = z.infer<typeof leaveTypeQuerySchema>;

// Initialize the model
LeaveType.init(
    {
        Id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            field: 'Id',
            allowNull: false,
            autoIncrement: true
        },
        LeaveType: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'LeaveType',
            validate: {
                notEmpty: true
            }
        }
    },
    {
        sequelize,
        tableName: 'tbl_LeaveType',
        modelName: modelName,
        timestamps: false,
        freezeTableName: true,
        hooks: {
            beforeCreate: async (leaveType: LeaveType) => {
                if (!leaveType.Id) {
                    const nextId = await LeaveType.getNextId();
                    leaveType.Id = nextId;
                }
            }
        }
    }
);

export const leaveTypeAccKey = {
    Id: `${modelName}.Id`,
    LeaveType: `${modelName}.LeaveType`
};