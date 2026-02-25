import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../config/sequalizer';



export interface AttendanceResult {
    fingerPrintEmpId: string;
    Designation_Name: string;
    username: string;
    LogDate: Date;
    AttendanceDetails: string;
    TotalRecords: number;
    AttendanceStatus: 'P' | 'A' | 'L' | 'H' | 'DL';
}

export interface AttendanceSummary {
    employeeId: string;
    month: number;
    year: number;
    totalDays: number;
    presentDays: number;
    absentDays: number;
    leaveDays: number;
    holidayDays: number;
    defaultLeaveDays: number;
    attendancePercentage: number;
}

export interface FingerprintAttendanceQuery {
    FromDate?: string;
    ToDate?: string;
    FingerPrintId?: string;
    EmpId?: string;
}

export interface DateRangeParams {
    startDate: string;
    endDate: string;
    EmpId?: string;
    FingerPrintId?: string;
}

export interface AttendanceStats {
    totalEmployees: number;
    totalPresent: number;
    totalAbsent: number;
    totalLeave: number;
    attendanceRate: number;
}


export interface EmployeeMasterAttributes {
    id: number;
    User_Mgt_Id?: number | null;
    fingerPrintEmpId?: string | null;
    Emp_Name?: string | null;
    Designation?: number | null;
    Department?: number | null;
    Mobile_No?: string | null;
    Email_Id?: string | null;
    Active_Status?: number | null;
    Created_Date?: Date | null;
    Updated_Date?: Date | null;
}

export interface EmployeeMasterCreationAttributes extends Optional<EmployeeMasterAttributes, 'id'> {}

export class EmployeeMaster extends Model<EmployeeMasterAttributes, EmployeeMasterCreationAttributes> 
    implements EmployeeMasterAttributes {
    public id!: number;
    public User_Mgt_Id!: number | null;
    public fingerPrintEmpId!: string | null;
    public Emp_Name!: string | null;
    public Designation!: number | null;
    public Department!: number | null;
    public Mobile_No!: string | null;
    public Email_Id!: string | null;
    public Active_Status!: number | null;
    public Created_Date!: Date | null;
    public Updated_Date!: Date | null;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

EmployeeMaster.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        User_Mgt_Id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        fingerPrintEmpId: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        Emp_Name: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        Designation: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        Department: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        Mobile_No: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        Email_Id: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        Active_Status: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 1,
        },
        Created_Date: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
        },
        Updated_Date: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'tbl_Employee_Master',
        timestamps: true,
        createdAt: 'Created_Date',
        updatedAt: 'Updated_Date',
    }
);


export interface EmployeeDesignationAttributes {
    Designation_Id: number;
    Designation: string;
}

export class EmployeeDesignation extends Model<EmployeeDesignationAttributes> 
    implements EmployeeDesignationAttributes {
    public Designation_Id!: number;
    public Designation!: string;
}

EmployeeDesignation.init(
    {
        Designation_Id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        Designation: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'tbl_Employee_Designation',
        timestamps: false,
    }
);



export interface UserAttributes {
    UserId: number;
    Name: string;
}

export class User extends Model<UserAttributes> implements UserAttributes {
    public UserId!: number;
    public Name!: string;
}

User.init(
    {
        UserId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        Name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        }
    },
    {
        sequelize,
        tableName: 'tbl_Users',
        timestamps: false,
    }
);


export interface LeaveMasterAttributes {
    LeaveId: number;
    User_Id: number;
    FromDate: Date;
    ToDate: Date;
    Status: string;
}

export class LeaveMaster extends Model<LeaveMasterAttributes> implements LeaveMasterAttributes {
    public LeaveId!: number;
    public User_Id!: number;
    public FromDate!: Date;
    public ToDate!: Date;
    public Status!: string;
}

LeaveMaster.init(
    {
        LeaveId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        User_Id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        FromDate: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        ToDate: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        Status: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'tbl_Leave_Master',
        timestamps: false,
    }
);


export interface DefaultLeaveAttributes {
    Id: number;
    Date: Date;
    Reason?: string;
}

export class DefaultLeave extends Model<DefaultLeaveAttributes> implements DefaultLeaveAttributes {
    public Id!: number;
    public Date!: Date;
    public Reason!: string;
}

DefaultLeave.init(
    {
        Id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        Date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        Reason: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'tbl_Default_Leave',
        timestamps: false,
    }
);

export interface AttendanceLogAttributes {
    AttendanceId: number;
    EmployeeId: number;
    AttendanceDate: Date;
    PunchRecords?: string;
    status?: string;
}



export default {
    EmployeeMaster,
    EmployeeDesignation,
    User,
    LeaveMaster,
    DefaultLeave
};