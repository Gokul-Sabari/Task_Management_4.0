
import { z } from 'zod';

export const ScheduleCreateSchema = z.object({
    Sch_No: z.string().min(1, 'Schedule number is required').max(50),
    Sch_Date: z.string().or(z.date()).transform(val => new Date(val)),
    Task_Id: z.number().int().positive('Task is required'),
    Sch_Type_Id: z.number().int(),
    Sch_Plan_Id: z.number().int().positive('Schedule plan is required'),
    Sch_Start_Date: z.string().or(z.date()).nullable().optional().transform(val => val ? new Date(val) : null),
    Sch_End_Date: z.string().or(z.date()).nullable().optional().transform(val => val ? new Date(val) : null),
    Task_Sch_Timer_Based: z.boolean().default(false),
    Sch_Est_Start_Time: z.string().nullable().optional(),
    Sch_Est_End_Time: z.string().nullable().optional(),
    Task_Sch_Duaration: z.number().int().nullable().optional(),
    Sch_Status: z.number().default(1),
    Entry_By: z.number().int().positive(),
    planDetails: z.object({
        Plan_Week: z.number().int().min(1).max(52).nullable().optional(),
        Plan_Month: z.number().int().min(1).max(12).nullable().optional(),
        Plan_Day: z.number().int().min(1).max(7).nullable().optional()
    }).optional()
});

export const ScheduleUpdateSchema = z.object({
    Sch_No: z.string().min(1, 'Schedule number is required').max(50),
    Sch_Date: z.string().or(z.date()).transform(val => new Date(val)),
    Task_Id: z.number().int().positive('Task is required'),
    Sch_Type_Id: z.number().int(),
    Sch_Plan_Id: z.number().int().positive('Schedule plan is required'),
    Sch_Start_Date: z.string().or(z.date()).nullable().optional().transform(val => val ? new Date(val) : null),
    Sch_End_Date: z.string().or(z.date()).nullable().optional().transform(val => val ? new Date(val) : null),
    Task_Sch_Timer_Based: z.boolean(),
    Sch_Est_Start_Time: z.string().nullable().optional(),
    Sch_Est_End_Time: z.string().nullable().optional(),
    Task_Sch_Duaration: z.number().int().nullable().optional(),
    Sch_Status: z.enum(['Active', 'Completed', 'Cancelled', 'On Hold']),
    Update_By: z.number().int().positive(),
    planDetails: z.object({
        Plan_Week: z.number().int().min(1).max(52).nullable().optional(),
        Plan_Month: z.number().int().min(1).max(12).nullable().optional(),
        Plan_Day: z.number().int().min(1).max(7).nullable().optional()
    }).optional()
});

export const ScheduleStatusUpdateSchema = z.object({
    status: z.enum(['Active', 'Completed', 'Cancelled', 'On Hold']),
    Update_By: z.number().int().positive()
});

export const ScheduleDetailSchema = z.object({
    Task_Work_Date: z.string().or(z.date()).transform(val => new Date(val)),
    Task_Start_Time: z.string(),
    Task_End_Time: z.string()
});

export const ScheduleQuerySchema = z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
    search: z.string().optional(),
    status: z.enum(['Active', 'Completed', 'Cancelled', 'On Hold']).optional(),
    planType: z.string().optional().transform(val => val ? parseInt(val) : undefined),
    taskId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    sortBy: z.enum(['Sch_Id', 'Sch_No', 'Sch_Date', 'Task_Name', 'Sch_Status', 'Entry_Date']).optional(),
    sortOrder: z.enum(['ASC', 'DESC']).optional()
});

export const ScheduleIdSchema = z.object({
    id: z.string().transform(val => parseInt(val))
});

// Type exports
export type ScheduleCreate = z.infer<typeof ScheduleCreateSchema>;
export type ScheduleUpdate = z.infer<typeof ScheduleUpdateSchema>;
export type ScheduleStatusUpdate = z.infer<typeof ScheduleStatusUpdateSchema>;
export type ScheduleDetail = z.infer<typeof ScheduleDetailSchema>;
export type ScheduleQuery = z.infer<typeof ScheduleQuerySchema>;