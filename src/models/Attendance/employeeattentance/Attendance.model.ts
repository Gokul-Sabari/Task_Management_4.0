import { DataTypes, Model, Optional, Op, fn, col, where } from 'sequelize';
import { sequelize } from '../../../config/sequalizer';
import { z } from 'zod';

const modelName = 'Attendance';

export interface AttendanceAttributes {
    Id: number;
    UserId: number;
    Start_Date: Date;
    End_Date?: Date | null;
    Latitude: number;
    Longitude: number;
    Active_Status: number;
    Work_Summary?: string | null;
    Del_Flag?: number | null;
}

type AttendanceCreationAttributes = Optional<AttendanceAttributes, 'Id' | 'End_Date' | 'Work_Summary' | 'Del_Flag'>;

export class Attendance extends Model<AttendanceAttributes, AttendanceCreationAttributes> implements AttendanceAttributes {
    declare Id: number;
    declare UserId: number;
    declare Start_Date: Date;
    declare End_Date: Date | null;
    declare Latitude: number;
    declare Longitude: number;
    declare Active_Status: number;
    declare Work_Summary: string | null;
    declare Del_Flag: number | null;
}

// Zod Schemas
export const attendanceCreateSchema = z.object({
    UserId: z.coerce.number()
        .int()
        .min(1, 'User ID must be positive'),
    Latitude: z.coerce.number()
        .min(-90, 'Latitude must be between -90 and 90')
        .max(90, 'Latitude must be between -90 and 90'),
    Longitude: z.coerce.number()
        .min(-180, 'Longitude must be between -180 and 180')
        .max(180, 'Longitude must be between -180 and 180')
});

export const attendanceCloseSchema = z.object({
    Id: z.coerce.number()
        .int()
        .min(1, 'Valid ID is required'),
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

// Initialize the model
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
        Latitude: {
            type: DataTypes.DECIMAL(10, 8),
            allowNull: false,
            field: 'Latitude',
            validate: {
                min: -90,
                max: 90
            }
        },
        Longitude: {
            type: DataTypes.DECIMAL(11, 8),
            allowNull: false,
            field: 'Longitude',
            validate: {
                min: -180,
                max: 180
            }
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
        Work_Summary: {
            type: DataTypes.STRING(500),
            allowNull: true,
            field: 'Work_Summary'
        },
        Del_Flag: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
            field: 'Del_Flag',
            validate: {
                min: 0,
                max: 1,
                isIn: {
                    args: [[0, 1]],
                    msg: 'Del_Flag must be 0 or 1'
                }
            }
        }
    },
    {
        sequelize,
        tableName: 'tbl_Attendance',
        modelName: modelName,
        timestamps: false,
        freezeTableName: true,
        defaultScope: {
            where: {
                Del_Flag: 0
            }
        },
        scopes: {
            active: {
                where: {
                    Del_Flag: 0,
                    Active_Status: 1
                }
            },
            completed: {
                where: {
                    Del_Flag: 0,
                    Active_Status: 0,
                    End_Date: { [Op.ne]: null }
                }
            },
            deleted: {
                where: {
                    Del_Flag: 1
                }
            },
            byUser: (userId: number) => ({
                where: {
                    UserId: userId,
                    Del_Flag: 0
                }
            }),
            today: {
                where: where(
                    fn('CONVERT', col('Start_Date'), 'DATE'),
                    fn('CONVERT', fn('GETDATE'), 'DATE')
                )
            }
        }
    }
);

export const attendanceAccKey = {
    Id: `${modelName}.Id`,
    UserId: `${modelName}.UserId`,
    Start_Date: `${modelName}.Start_Date`,
    End_Date: `${modelName}.End_Date`,
    Latitude: `${modelName}.Latitude`,
    Longitude: `${modelName}.Longitude`,
    Active_Status: `${modelName}.Active_Status`,
    Work_Summary: `${modelName}.Work_Summary`,
    Del_Flag: `${modelName}.Del_Flag`
};

Attendance.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    delete values.Del_Flag;
    return values;
};

export default Attendance;