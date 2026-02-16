export interface FingerprintAttendanceQuery {
    FromDate?: string;
    ToDate?: string;
    FingerPrintId?: string;
    EmpId?: string;
}

export interface AttendanceResult {
    fingerPrintEmpId: string;
    Designation_Name: string;
    username: string;
    LogDate: Date;
    AttendanceDetails: string;
    TotalRecords: number;
    AttendanceStatus: 'P' | 'A' | 'L' | 'H' | 'DL';
}

export interface EmployeeAttendanceParams {
    FromDate: string;
    ToDate: string;
    EmpId: string;
}

export interface MultipleAttendanceParams {
    FromDate: string;
    ToDate: string;
    FingerPrintId?: string;
}