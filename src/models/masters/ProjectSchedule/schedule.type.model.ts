import { z } from 'zod';

// Plan Types:
// 1: Time Based (Special)
// 2: Day Based (Daily - days of week)
// 3: Weekly Based (Weekly - weeks of month)
// 4: Monthly Based (Monthly - days of month)
// 5: Specific Day (One Time)

export const ScheduleCreateSchema = z.object({
    Sch_No: z.string().min(1, 'Schedule number is required').max(50),
    Sch_Date: z.union([z.string(), z.date()]).optional().transform(val => val ? new Date(val) : new Date()),
    Task_Id: z.number().int().positive('Task is required'),
    Sch_Type_Id: z.number().int().positive('Schedule type is required'),
    Sch_Plan_Id: z.number().int().min(1).max(5, 'Plan Id must be between 1 and 5'),
    Sch_Start_Date: z.union([z.string(), z.date(), z.null()]).transform(val => val ? new Date(val) : null),
    Sch_End_Date: z.union([z.string(), z.date(), z.null()]).transform(val => val ? new Date(val) : null),
    Task_Sch_Timer_Based: z.boolean().default(false),
    Sch_Est_Start_Time: z.string().nullable(),
    Sch_Est_End_Time: z.string().nullable(),
    Task_Sch_Duaration: z.number().nullable(),
    Sch_Status: z.number().int().min(0).max(4).default(1),
    Entry_By: z.number().int().positive('Entry user is required'),
    
    // Plan details based on Sch_Plan_Id
    planDetails: z.object({
        Plan_Month: z.union([z.number().int().min(0).max(12), z.null()]).optional(),
        Plan_Day: z.union([z.number().int().min(0).max(31), z.null()]).optional()
    }).optional().default({}),
    
    selectedDays: z.array(z.number().int()).optional().default([]),
    specificDates: z.array(z.string()).optional().default([])
}).superRefine((data, ctx) => {
    // CRITICAL FIX: Allow end date to be equal to start date (same day)
    if (data.Sch_Start_Date && data.Sch_End_Date) {
        const startDate = new Date(data.Sch_Start_Date);
        const endDate = new Date(data.Sch_End_Date);
        
        // Set time to midnight for date comparison only
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        
        // FIXED: Changed from <= to < to allow same day
        // This will only throw error if end date is BEFORE start date
        if (endDate < startDate) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['Sch_End_Date'],
                message: 'End date must be on or after start date',
            });
        }
    }
    
    // Validate plan details based on plan type
    const { Sch_Plan_Id, planDetails, selectedDays } = data;
    
    if (Sch_Plan_Id === 2) { // Day Based (Daily)
        if (selectedDays && selectedDays.length > 0) {
            const invalidDays = selectedDays.filter(d => d < 1 || d > 7);
            if (invalidDays.length > 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['selectedDays'],
                    message: 'For Day Based plan, selected days must be between 1 and 7 (1=Monday, 7=Sunday)',
                });
            }
        }
    } 
    else if (Sch_Plan_Id === 3) { // Weekly Based
        if (selectedDays && selectedDays.length > 0) {
            const invalidWeeks = selectedDays.filter(w => w < 1 || w > 5);
            if (invalidWeeks.length > 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['selectedDays'],
                    message: 'For Weekly Based plan, selected weeks must be between 1 and 5',
                });
            }
        }
        if (planDetails?.Plan_Month !== undefined && planDetails.Plan_Month !== null) {
            if (planDetails.Plan_Month < 0 || planDetails.Plan_Month > 12) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['planDetails.Plan_Month'],
                    message: 'Plan month must be between 0 and 12 (0 for all months)',
                });
            }
        }
    } 
    else if (Sch_Plan_Id === 4) { // Monthly Based
        if (selectedDays && selectedDays.length > 0) {
            const invalidDays = selectedDays.filter(d => d < 1 || d > 31);
            if (invalidDays.length > 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['selectedDays'],
                    message: 'For Monthly Based plan, selected days must be between 1 and 31',
                });
            }
        }
        if (planDetails?.Plan_Month !== undefined && planDetails.Plan_Month !== null) {
            if (planDetails.Plan_Month < 0 || planDetails.Plan_Month > 12) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['planDetails.Plan_Month'],
                    message: 'Plan month must be between 0 and 12 (0 for all months)',
                });
            }
        }
    }
    else if (Sch_Plan_Id === 5) { // Specific Day (One Time)
        if (data.Sch_Start_Date && data.Sch_End_Date) {
            const startDate = new Date(data.Sch_Start_Date);
            const endDate = new Date(data.Sch_End_Date);
            
            // For one-time schedules, start and end date should be the same
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);
            
            // FIXED: Allow same day for one-time schedules
            if (endDate.getTime() !== startDate.getTime()) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['Sch_End_Date'],
                    message: 'For one-time schedule, end date must be the same as start date',
                });
            }
        }
    }
});

export const ScheduleUpdateSchema = z.object({
    Sch_No: z.string().min(1, 'Schedule number is required').max(50).optional(),
    Sch_Date: z.union([z.string(), z.date()]).optional().transform(val => val ? new Date(val) : undefined),
    Task_Id: z.number().int().positive('Task is required').optional(),
    Sch_Type_Id: z.number().int().positive().optional(),
    Sch_Plan_Id: z.number().int().min(1).max(5).optional(),
    Sch_Start_Date: z.union([z.string(), z.date(), z.null()]).optional().transform(val => val ? new Date(val) : null),
    Sch_End_Date: z.union([z.string(), z.date(), z.null()]).optional().transform(val => val ? new Date(val) : null),
    Task_Sch_Timer_Based: z.boolean().optional(),
    Sch_Est_Start_Time: z.string().nullable().optional(),
    Sch_Est_End_Time: z.string().nullable().optional(),
    Task_Sch_Duaration: z.number().nullable().optional(),
    Sch_Status: z.number().int().min(0).max(4).optional(),
    Update_By: z.number().int().positive('Update user is required'),
    planDetails: z.object({
        Plan_Month: z.union([z.number().int().min(0).max(12), z.null()]).optional(),
        Plan_Day: z.union([z.number().int().min(0).max(31), z.null()]).optional()
    }).optional(),
    selectedDays: z.array(z.number().int()).optional(),
    specificDates: z.array(z.string()).optional()
}).superRefine((data, ctx) => {
    // CRITICAL FIX: Allow end date to be equal to start date (same day)
    if (data.Sch_Start_Date && data.Sch_End_Date) {
        const startDate = new Date(data.Sch_Start_Date);
        const endDate = new Date(data.Sch_End_Date);
        
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        
        // FIXED: Changed from <= to < to allow same day
        if (endDate < startDate) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['Sch_End_Date'],
                message: 'End date must be on or after start date',
            });
        }
    }
    
    // Additional validation for plan type if Sch_Plan_Id is provided
    if (data.Sch_Plan_Id === 5 && data.Sch_Start_Date && data.Sch_End_Date) {
        const startDate = new Date(data.Sch_Start_Date);
        const endDate = new Date(data.Sch_End_Date);
        
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        
        // FIXED: For one-time schedules, they must be the same day
        if (endDate.getTime() !== startDate.getTime()) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['Sch_End_Date'],
                message: 'For one-time schedule, end date must be the same as start date',
            });
        }
    }
});

export const ScheduleStatusUpdateSchema = z.object({
    status: z.number().int().min(0).max(4),
    Update_By: z.number().int().positive()
});

export const ScheduleDetailSchema = z.object({
    Task_Work_Date: z.union([z.string(), z.date()]).transform(val => new Date(val)),
    Task_Start_Time: z.string().nullable(),
    Task_End_Time: z.string().nullable()
});

export const ScheduleQuerySchema = z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
    search: z.string().optional(),
    status: z.string().optional().transform(val => val ? parseInt(val) : undefined),
    planType: z.string().optional().transform(val => val ? parseInt(val) : undefined),
    taskId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
    dateFrom: z.string().optional().transform(val => val ? new Date(val) : undefined),
    dateTo: z.string().optional().transform(val => val ? new Date(val) : undefined),
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