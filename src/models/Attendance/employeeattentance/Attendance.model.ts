import { DataTypes, Model, Optional, Op } from 'sequelize';
import { sequelize } from '../../../config/sequalizer';
import { z } from 'zod';

const modelName = 'Attendance';

export interface AttendanceAttributes {
    Id: number;
    UserId: number;
    Start_Date: Date;
    End_Date?: Date | null;
    IsSalesPerson: number;
    Start_KM?: number | null;
    End_KM?: number | null;
    Latitude?: number | null;
    Longitude?: number | null;
    Start_KM_ImageName?: string | null;
    End_KM_ImageName?: string | null;
    Start_KM_ImagePath?: string | null;
    End_KM_ImagePath?: string | null;
    WorkSummary?: string | null;
    Active_Status: number;
}

type AttendanceCreationAttributes = Optional<AttendanceAttributes, 
    'Id' | 'End_Date' | 'Start_KM' | 'End_KM' | 'Latitude' | 'Longitude' | 
    'Start_KM_ImageName' | 'End_KM_ImageName' | 'Start_KM_ImagePath' | 'End_KM_ImagePath' | 
    'WorkSummary' 
>;

export class Attendance extends Model<AttendanceAttributes, AttendanceCreationAttributes> implements AttendanceAttributes {
    declare Id: number;
    declare UserId: number;
    declare Start_Date: Date;
    declare End_Date: Date | null;
    declare IsSalesPerson: number;
    declare Start_KM: number | null;
    declare End_KM: number | null;
    declare Latitude: number | null;
    declare Longitude: number | null;
    declare Start_KM_ImageName: string | null;
    declare End_KM_ImageName: string | null;
    declare Start_KM_ImagePath: string | null;
    declare End_KM_ImagePath: string | null;
    declare WorkSummary: string | null;
    declare Active_Status: number;
}

// Zod Schemas
export const attendanceCreateSchema = z.object({
    UserId: z.coerce.number()
        .int()
        .min(1, 'User ID must be positive'),
    Start_KM: z.coerce.number()
        .optional()
        .nullable(),
    Latitude: z.coerce.number()
        .min(-90, 'Latitude must be between -90 and 90')
        .max(90, 'Latitude must be between -90 and 90')
        .optional()
        .nullable(),
    Longitude: z.coerce.number()
        .min(-180, 'Longitude must be between -180 and 180')
        .max(180, 'Longitude must be between -180 and 180')
        .optional()
        .nullable()
});

export const attendanceCloseSchema = z.object({
    Id: z.coerce.number()
        .int()
        .min(1, 'Valid ID is required'),
    End_KM: z.coerce.number()
        .optional()
        .nullable(),
    Description: z.string()
        .max(500, 'Work summary cannot exceed 500 characters')
        .optional()
        .nullable()
        .default('')
});

export const attendanceQuerySchema = z.object({
    userId: z.coerce.number()
        .int()
        .positive('User ID must be positive')
        .optional()
        .nullable(),
    from: z.string()
        .optional()
        .nullable(),
    to: z.string()
        .optional()
        .nullable(),
    status: z.enum(['0', '1', 'all'])
        .default('1'),
    delFlag: z.enum(['0', '1', 'all'])
        .default('0'),
    sortBy: z.enum([
        'Id',
        'UserId',
        'Start_Date',
        'End_Date',
        'Active_Status'
    ])
        .default('Start_Date'),
    sortOrder: z.enum(['ASC', 'DESC'])
        .default('DESC'),
    page: z.coerce.number()
        .int()
        .positive()
        .default(1),
    limit: z.coerce.number()
        .int()
        .positive()
        .max(100)
        .default(20)
});

export const attendanceIdSchema = z.object({
    id: z.coerce.number()
        .int()
        .positive('Valid ID is required')
});

export const userAttendanceQuerySchema = z.object({
    UserId: z.coerce.number()
        .int()
        .positive('User ID is required')
});

export const attendanceHistoryQuerySchema = z.object({
    From: z.string()
        .min(1, 'From date is required'),
    To: z.string()
        .min(1, 'To date is required'),
    UserId: z.coerce.number()
        .int()
        .positive('User ID must be positive')
        .optional()
        .nullable()
});

export type AttendanceCreateInput = z.infer<typeof attendanceCreateSchema>;
export type AttendanceCloseInput = z.infer<typeof attendanceCloseSchema>;
export type AttendanceQueryParams = z.infer<typeof attendanceQuerySchema>;
export type AttendanceHistoryQueryParams = z.infer<typeof attendanceHistoryQuerySchema>;


Attendance.init(
    {
        Id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            field: 'Id'
        },
        UserId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'UserId',
            validate: {
                min: {
                    args: [1],
                    msg: 'User ID must be positive'
                }
            }
        },
        Start_Date: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'Start_Date',
            defaultValue: DataTypes.NOW
        },
        End_Date: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'End_Date'
        },
        IsSalesPerson: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'IsSalesPerson',
            defaultValue: 0,
            validate: {
                min: 0,
                max: 1,
                isIn: {
                    args: [[0, 1]],
                    msg: 'IsSalesPerson must be 0 or 1'
                }
            }
        },
        Start_KM: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            field: 'Start_KM'
        },
        End_KM: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            field: 'End_KM'
        },
        Latitude: {
            type: DataTypes.DECIMAL(10, 8),
            allowNull: true,
            field: 'Latitude'
        },
        Longitude: {
            type: DataTypes.DECIMAL(11, 8),
            allowNull: true,
            field: 'Longitude'
        },
        Start_KM_ImageName: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'Start_KM_ImageName'
        },
        End_KM_ImageName: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'End_KM_ImageName'
        },
        Start_KM_ImagePath: {
            type: DataTypes.STRING(500),
            allowNull: true,
            field: 'Start_KM_ImagePath'
        },
        End_KM_ImagePath: {
            type: DataTypes.STRING(500),
            allowNull: true,
            field: 'End_KM_ImagePath'
        },
        WorkSummary: {
            type: DataTypes.STRING(500),
            allowNull: true,
            field: 'WorkSummary'
        },
        Active_Status: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'Active_Status',
            defaultValue: 1,
            validate: {
                min: 0,
                max: 1,
                isIn: {
                    args: [[0, 1]],
                    msg: 'Active_Status must be 0 or 1'
                }
            }
        },
    
    },
    {
        sequelize,
        tableName: 'tbl_Attendance',
        modelName: modelName,
        timestamps: false,
        freezeTableName: true,
        schema: 'dbo'
    }
);

export const attendanceAccKey = {
    Id: `${modelName}.Id`,
    UserId: `${modelName}.UserId`,
    Start_Date: `${modelName}.Start_Date`,
    End_Date: `${modelName}.End_Date`,
    IsSalesPerson: `${modelName}.IsSalesPerson`,
    Start_KM: `${modelName}.Start_KM`,
    End_KM: `${modelName}.End_KM`,
    Latitude: `${modelName}.Latitude`,
    Longitude: `${modelName}.Longitude`,
    Start_KM_ImageName: `${modelName}.Start_KM_ImageName`,
    End_KM_ImageName: `${modelName}.End_KM_ImageName`,
    Start_KM_ImagePath: `${modelName}.Start_KM_ImagePath`,
    End_KM_ImagePath: `${modelName}.End_KM_ImagePath`,
    WorkSummary: `${modelName}.WorkSummary`,
    Active_Status: `${modelName}.Active_Status`
};

Attendance.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    delete values.Start_KM_ImagePath;
    delete values.End_KM_ImagePath;
    return values;
};

export default Attendance;