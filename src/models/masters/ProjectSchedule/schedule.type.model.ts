import { z } from 'zod';

// Plan Types:
// 1: Time Based
// 2: Day Based (Weekly - days of week)
// 3: Weekly Based (Monthly - weeks of month)
// 4: Monthly Based (Monthly - days of month)
// 5: Specific Day

export const ScheduleCreateSchema = z.object({
    Sch_No: z.string().min(1, 'Schedule number is required').max(50),
    Sch_Date: z.string().or(z.date()).transform(val => new Date(val)),
    Task_Id: z.number().int().positive('Task is required'),
    Sch_Type_Id: z.number().int(),
    Sch_Plan_Id: z.number().int().min(1).max(5, 'Plan Id must be between 1 and 5'),
    Sch_Start_Date: z.string().or(z.date()).transform(val => new Date(val)),
    Sch_End_Date: z.string().or(z.date()).transform(val => new Date(val)),
    Task_Sch_Timer_Based: z.boolean().default(false),
    Sch_Est_Start_Time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    Sch_Est_End_Time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    Task_Sch_Duaration: z.number().int().positive().optional(),
    Sch_Status: z.number().int().min(0).max(4).default(1), // 1=Active based on your data
    Entry_By: z.number().int().positive(),
    
    // Plan details based on Sch_Plan_Id - matches your tbl_Project_Sch_DT structure
    planDetails: z.object({
        Plan_Month: z.union([
            z.number().int().min(0).max(12), // 0 means all months
            z.null()
        ]).optional(),
        Plan_Day: z.union([
            z.number().int().min(0).max(31), // Day of month (1-31) or day of week (1-7)
            z.null()
        ]).optional()
    }).optional().default({}),
    
    // Selected days array for weekly/monthly patterns
    selectedDays: z.array(z.number().int()).optional().default([])
}).superRefine((data, ctx) => {
    // Validate that end date is after start date
    if (data.Sch_End_Date <= data.Sch_Start_Date) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['Sch_End_Date'],
            message: 'End date must be after start date',
        });
    }
    
    // Validate plan details based on plan type
    const { Sch_Plan_Id, planDetails, selectedDays } = data;
    
    if (Sch_Plan_Id === 2) { // Day Based (Weekly)
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
    // For Plan 1 and 5, no validation needed
});

export const ScheduleUpdateSchema = z.object({
    Sch_No: z.string().min(1, 'Schedule number is required').max(50).optional(),
    Sch_Date: z.string().or(z.date()).transform(val => new Date(val)).optional(),
    Task_Id: z.number().int().positive('Task is required').optional(),
    Sch_Type_Id: z.number().int().optional(),
    Sch_Plan_Id: z.number().int().min(1).max(5).optional(),
    Sch_Start_Date: z.string().or(z.date()).transform(val => new Date(val)).optional(),
    Sch_End_Date: z.string().or(z.date()).transform(val => new Date(val)).optional(),
    Task_Sch_Timer_Based: z.boolean().optional(),
    Sch_Est_Start_Time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
    Sch_Est_End_Time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
    Task_Sch_Duaration: z.number().int().positive().optional(),
    Sch_Status: z.number().int().min(0).max(4).optional(),
    Update_By: z.number().int().positive(),
    planDetails: z.object({
        Plan_Month: z.union([
            z.number().int().min(0).max(12),
            z.null()
        ]).optional(),
        Plan_Day: z.union([
            z.number().int().min(0).max(31),
            z.null()
        ]).optional()
    }).optional(),
    selectedDays: z.array(z.number().int()).optional()
}).superRefine((data, ctx) => {
    // Only validate if both dates are provided
    if (data.Sch_Start_Date && data.Sch_End_Date) {
        if (data.Sch_End_Date <= data.Sch_Start_Date) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['Sch_End_Date'],
                message: 'End date must be after start date',
            });
        }
    }
    
    // Validate selectedDays if provided and Sch_Plan_Id is provided
    if (data.Sch_Plan_Id && data.selectedDays && data.selectedDays.length > 0) {
        if (data.Sch_Plan_Id === 2) {
            const invalidDays = data.selectedDays.filter(d => d < 1 || d > 7);
            if (invalidDays.length > 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['selectedDays'],
                    message: 'For Day Based plan, selected days must be between 1 and 7 (1=Monday, 7=Sunday)',
                });
            }
        } else if (data.Sch_Plan_Id === 3) {
            const invalidWeeks = data.selectedDays.filter(w => w < 1 || w > 5);
            if (invalidWeeks.length > 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['selectedDays'],
                    message: 'For Weekly Based plan, selected weeks must be between 1 and 5',
                });
            }
        } else if (data.Sch_Plan_Id === 4) {
            const invalidDays = data.selectedDays.filter(d => d < 1 || d > 31);
            if (invalidDays.length > 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['selectedDays'],
                    message: 'For Monthly Based plan, selected days must be between 1 and 31',
                });
            }
        }
    }

    // Validate planDetails month if provided
    if (data.planDetails?.Plan_Month !== undefined && data.planDetails.Plan_Month !== null) {
        if (data.planDetails.Plan_Month < 0 || data.planDetails.Plan_Month > 12) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['planDetails.Plan_Month'],
                message: 'Plan month must be between 0 and 12 (0 for all months)',
            });
        }
    }
});

export const ScheduleStatusUpdateSchema = z.object({
    status: z.number().int().min(0).max(4), // Based on your data where 1=Active
    Update_By: z.number().int().positive()
});

export const ScheduleDetailSchema = z.object({
    Task_Work_Date: z.string().or(z.date()).transform(val => new Date(val)),
    Task_Start_Time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    Task_End_Time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)')
});

export const ScheduleQuerySchema = z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
    search: z.string().optional(),
    status: z.string().optional().transform(val => val ? parseInt(val) : undefined), // Status as number
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