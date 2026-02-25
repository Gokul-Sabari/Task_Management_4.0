

// import { Request, Response } from 'express';
// import { ZodError } from 'zod';
// import { sequelize } from '../../../config/sequalizer';
// import TaskDetail_Master, {
//   TaskDetailCreateInput,
//   taskDetailCreateSchema,
//   TaskDetailAttributes
// } from '../../../models/masters/taskDetails/type.model';
// import { Op } from 'sequelize';

// const validateWithZod = <T>(schema: any, data: any): {
//   success: boolean;
//   data?: T;
//   errors?: Array<{ field: string; message: string }>
// } => {
//   try {
//     const validatedData = schema.parse(data);
//     return { success: true, data: validatedData };
//   } catch (error: any) {
//     if (error instanceof ZodError) {
 
//       return {
//         success: false,
       
//       };
//     }
//     return {
//       success: false,
//       errors: [{ field: 'unknown', message: 'Validation failed' }]
//     };
//   }
// };


// export const createTaskDetailsRaw = async (req: Request, res: Response) => {
//   const transaction = await sequelize.transaction();

//   try {
//     const validation = validateWithZod<TaskDetailCreateInput>(
//       taskDetailCreateSchema,
//       req.body
//     );

//     if (!validation.success) {
//       await transaction.rollback();
//       return res.status(400).json({
//         success: false,
//         message: "Validation failed",
//         errors: validation.errors
//       });
//     }

//     const {
//       Project_Id,
//       Sch_Id,
//       Task_Id,
//       Emp_Ids,
//       Task_Levl_Id,
//       Assigned_Emp_Id,
//       Task_Assign_dt,
//       Sch_Period,
//       Sch_Time,
//       EN_Time,
//       Ord_By,
//       Invovled_Stat
//     } = validation.data!;


//     const [maxAnNoResult] = await sequelize.query(
//       `
//       SELECT ISNULL(MAX(AN_No), 0) AS maxANNo
//       FROM tbl_Task_Details
//       `,
//       { transaction }
//     );

//     const [maxIdResult] = await sequelize.query(
//       `
//       SELECT ISNULL(MAX(Id), 0) AS maxId
//       FROM tbl_Task_Details 
//       `,
//       { transaction }
//     );

//     let nextANNo = ((maxAnNoResult as Array<{ maxANNo: number }>)[0]?.maxANNo ?? 0) + 1;
//     let nextId   = ((maxIdResult   as Array<{ maxId:   number }>)[0]?.maxId   ?? 0) + 1;



//     const insertedAN_NoValues: number[] = [];

//     for (let i = 0; i < Emp_Ids.length; i++) {

//       await sequelize.query(
//         `
//         INSERT INTO tbl_Task_Details
//         (
//           AN_No,
//           Project_Id,
//           Sch_Id,
//           Task_Levl_Id,
//           Task_Id,
//           Assigned_Emp_Id,
//           Emp_Id,
//           Task_Assign_dt,
//           Sch_Period,
//           Sch_Time,
//           EN_Time,
//           Ord_By,
//           Invovled_Stat
//         )
//         VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//         `,
//         {
//           replacements: [
//             nextANNo,
//             Project_Id,
//             Sch_Id,
//             Task_Levl_Id     || null,
//             Task_Id,
//             Assigned_Emp_Id  || null,
//             Emp_Ids[i],
//             Task_Assign_dt   || new Date(),
//             Sch_Period       || null,
//             Sch_Time         || null,
//             EN_Time          || null,
//             Ord_By           || null,
//             Invovled_Stat    || null
//           ],
//           transaction
//         }
//       );

//       insertedAN_NoValues.push(nextANNo);

    
//       nextANNo++;
//       nextId++;
//     }

//     await transaction.commit();

//     return res.status(201).json({
//       success: true,
//       message: `Task details created successfully for ${Emp_Ids.length} employee(s)`,
//       data: {
//         totalRecords: Emp_Ids.length,
//         employeeIds: Emp_Ids,
//         anNoValuesUsed: insertedAN_NoValues
//       }
//     });

//   } catch (error: any) {
//     await transaction.rollback();
//     console.error("Error creating task details:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Internal server error"
//     });
//   }
// };



// Add these imports at the top of your controller file
import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { ZodError } from 'zod';
import { sequelize } from '../../../config/sequalizer';
import {
    created,
    updated,
    deleted,
    servError,
    notFound,
    sentData
} from '../../../responseObject';
import TaskDetail_Master, {
    taskDetailCreateSchema,
    taskDetailUpdateSchema,
    taskDetailQuerySchema,
    taskDetailIdSchema,
    TaskDetailCreateInput,
    TaskDetailUpdateInput,
    TaskDetailQueryParams
} from '../../../models/masters/taskDetails/type.model';

// Helper functions for param parsing
function parseIdParam(param: string | string[] | undefined): number | null {
    if (!param || Array.isArray(param)) return null;
    const parsed = parseInt(param);
    return isNaN(parsed) ? null : parsed;
}

function getStringParam(param: string | string[] | undefined): string | undefined {
    if (!param) return undefined;
    return Array.isArray(param) ? param[0] : param;
}

// Validation helper
const validateWithZod = <T>(schema: any, data: any): {
    success: boolean;
    data?: T;
    errors?: Array<{ field: string; message: string }>
} => {
    try {
        const validatedData = schema.parse(data);
        return { success: true, data: validatedData };
    } catch (error: any) {
        if (error instanceof ZodError) {
            const zodIssues = error.issues || (error as any).errors || [];
            return {
                success: false,
                errors: zodIssues.map((err: any) => ({
                    field: Array.isArray(err.path) ? err.path.join('.') : String(err.path || 'unknown'),
                    message: err.message || 'Validation error'
                }))
            };
        }
        return {
            success: false,
            errors: [{ field: 'unknown', message: 'Validation failed' }]
        };
    }
};

// GET ALL with pagination and filtering
export const getAllTaskDetails = async (req: Request, res: Response) => {
    try {
        const validation = validateWithZod<TaskDetailQueryParams>(taskDetailQuerySchema, req.query);
        
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        const {
            page = 1,
            limit = 20,
            Project_Id,
            Sch_Id,
            Task_Id,
            Emp_Id,
            Assigned_Emp_Id,
            Invovled_Stat,
            from_Task_Assign_dt,
            to_Task_Assign_dt,
            sortBy = 'Id',
            sortOrder = 'DESC'
        } = validation.data!;

        const pageNum = Math.max(1, page);
        const limitNum = Math.min(Math.max(1, limit), 100);
        const offset = (pageNum - 1) * limitNum;

        const whereClause: any = {};

        if (Project_Id) whereClause.Project_Id = Project_Id;
        if (Sch_Id) whereClause.Sch_Id = Sch_Id;
        if (Task_Id) whereClause.Task_Id = Task_Id;
        if (Emp_Id) whereClause.Emp_Id = Emp_Id;
        if (Assigned_Emp_Id) whereClause.Assigned_Emp_Id = Assigned_Emp_Id;
        if (Invovled_Stat !== undefined) whereClause.Invovled_Stat = Invovled_Stat;

        if (from_Task_Assign_dt || to_Task_Assign_dt) {
            whereClause.Task_Assign_dt = {};
            if (from_Task_Assign_dt) {
                const start = new Date(from_Task_Assign_dt);
                start.setHours(0, 0, 0, 0);
                whereClause.Task_Assign_dt[Op.gte] = start;
            }
            if (to_Task_Assign_dt) {
                const end = new Date(to_Task_Assign_dt);
                end.setHours(23, 59, 59, 999);
                whereClause.Task_Assign_dt[Op.lte] = end;
            }
        }

        const validSortFields = ['Id', 'AN_No', 'Project_Id', 'Sch_Id', 'Task_Id', 'Emp_Id', 'Task_Assign_dt', 'Sch_Time', 'EN_Time', 'Invovled_Stat'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'Id';
        const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const { count, rows } = await TaskDetail_Master.findAndCountAll({
            where: whereClause,
            limit: limitNum,
            offset: offset,
            order: [[sortField, sortDirection]]
        });

        return res.status(200).json({
            success: true,
            message: 'Task details retrieved successfully',
            data: rows,
            metadata: {
                totalRecords: count,
                currentPage: pageNum,
                totalPages: Math.ceil(count / limitNum),
                pageSize: limitNum
            }
        });

    } catch (error: any) {
        console.error('Error fetching task details:', error);
        return servError(res, error.message || 'Internal server error');
    }
};

// GET BY ID
export const getTaskDetailById = async (req: Request, res: Response) => {
    try {
        const id = parseIdParam(req.params.id);
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID parameter'
            });
        }

        const validation = validateWithZod<{ id: number }>(taskDetailIdSchema, { id });
        
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        const taskDetail = await TaskDetail_Master.findByPk(id);
        
        if (!taskDetail) {
            return notFound(res, 'Task detail not found');
        }

        return res.status(200).json({
            success: true,
            message: 'Task detail retrieved successfully',
            data: taskDetail
        });

    } catch (error: any) {
        console.error('Error fetching task detail:', error);
        return servError(res, error.message || 'Internal server error');
    }
};

// GET BY PROJECT
export const getTaskDetailsByProject = async (req: Request, res: Response) => {
    try {
        const projectIdParam = getStringParam(req.params.projectId);
        
        if (!projectIdParam || isNaN(parseInt(projectIdParam))) {
            return res.status(400).json({
                success: false,
                message: 'Valid project ID is required'
            });
        }

        const projectId = parseInt(projectIdParam);

        const taskDetails = await TaskDetail_Master.findAll({
            where: { Project_Id: projectId },
            order: [['Id', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            message: 'Task details retrieved successfully',
            data: taskDetails
        });

    } catch (error: any) {
        console.error('Error fetching task details by project:', error);
        return servError(res, error.message || 'Internal server error');
    }
};

// GET BY SCHEDULE
export const getTaskDetailsBySchedule = async (req: Request, res: Response) => {
    try {
        const schIdParam = getStringParam(req.params.schId);
        
        if (!schIdParam || isNaN(parseInt(schIdParam))) {
            return res.status(400).json({
                success: false,
                message: 'Valid schedule ID is required'
            });
        }

        const schId = parseInt(schIdParam);

        const taskDetails = await TaskDetail_Master.findAll({
            where: { Sch_Id: schId },
            order: [['Id', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            message: 'Task details retrieved successfully',
            data: taskDetails
        });

    } catch (error: any) {
        console.error('Error fetching task details by schedule:', error);
        return servError(res, error.message || 'Internal server error');
    }
};

// GET BY TASK
export const getTaskDetailsByTask = async (req: Request, res: Response) => {
    try {
        const taskIdParam = getStringParam(req.params.taskId);
        
        if (!taskIdParam || isNaN(parseInt(taskIdParam))) {
            return res.status(400).json({
                success: false,
                message: 'Valid task ID is required'
            });
        }

        const taskId = parseInt(taskIdParam);

        const taskDetails = await TaskDetail_Master.findAll({
            where: { Task_Id: taskId },
            order: [['Id', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            message: 'Task details retrieved successfully',
            data: taskDetails
        });

    } catch (error: any) {
        console.error('Error fetching task details by task:', error);
        return servError(res, error.message || 'Internal server error');
    }
};

// GET BY EMPLOYEE
export const getTaskDetailsByEmployee = async (req: Request, res: Response) => {
    try {
        const empIdParam = getStringParam(req.params.empId);
        
        if (!empIdParam || isNaN(parseInt(empIdParam))) {
            return res.status(400).json({
                success: false,
                message: 'Valid employee ID is required'
            });
        }

        const empId = parseInt(empIdParam);

        const taskDetails = await TaskDetail_Master.findAll({
            where: { Emp_Id: empId },
            order: [['Id', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            message: 'Task details retrieved successfully',
            data: taskDetails
        });

    } catch (error: any) {
        console.error('Error fetching task details by employee:', error);
        return servError(res, error.message || 'Internal server error');
    }
};

// GET WITH ADVANCED FILTERS
export const getTaskDetailsWithFilters = async (req: Request, res: Response) => {
    try {
        const validation = validateWithZod<TaskDetailQueryParams>(taskDetailQuerySchema, req.query);
        
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        const {
            page = 1,
            limit = 20,
            Project_Ids,
            Task_Ids,
            Emp_Ids,
            has_AN_No,
            has_Assigned_Emp,
            sortBy = 'Id',
            sortOrder = 'DESC'
        } = validation.data!;

        const pageNum = Math.max(1, page);
        const limitNum = Math.min(Math.max(1, limit), 100);
        const offset = (pageNum - 1) * limitNum;

        const whereClause: any = {};

        if (Project_Ids && Project_Ids.length > 0) {
            whereClause.Project_Id = { [Op.in]: Project_Ids };
        }

        if (Task_Ids && Task_Ids.length > 0) {
            whereClause.Task_Id = { [Op.in]: Task_Ids };
        }

        if (Emp_Ids && Emp_Ids.length > 0) {
            whereClause.Emp_Id = { [Op.in]: Emp_Ids };
        }

        if (has_AN_No !== undefined) {
            whereClause.AN_No = has_AN_No ? { [Op.ne]: null } : null;
        }

        if (has_Assigned_Emp !== undefined) {
            whereClause.Assigned_Emp_Id = has_Assigned_Emp ? { [Op.ne]: null } : null;
        }

        const validSortFields = ['Id', 'AN_No', 'Project_Id', 'Sch_Id', 'Task_Id', 'Emp_Id', 'Task_Assign_dt', 'Sch_Time', 'EN_Time', 'Invovled_Stat'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'Id';
        const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const { count, rows } = await TaskDetail_Master.findAndCountAll({
            where: whereClause,
            limit: limitNum,
            offset: offset,
            order: [[sortField, sortDirection]]
        });

        return res.status(200).json({
            success: true,
            message: 'Task details retrieved successfully',
            data: rows,
            metadata: {
                totalRecords: count,
                currentPage: pageNum,
                totalPages: Math.ceil(count / limitNum),
                pageSize: limitNum
            }
        });

    } catch (error: any) {
        console.error('Error fetching task details with filters:', error);
        return servError(res, error.message || 'Internal server error');
    }
};

// UPDATE
export const updateTaskDetail = async (req: Request, res: Response) => {
    try {
        const id = parseIdParam(req.params.id);
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID parameter'
            });
        }

        const idValidation = validateWithZod<{ id: number }>(taskDetailIdSchema, { id });
        
        if (!idValidation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: idValidation.errors
            });
        }

        const bodyValidation = validateWithZod<TaskDetailUpdateInput>(taskDetailUpdateSchema, req.body);
        
        if (!bodyValidation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: bodyValidation.errors
            });
        }

        const updateData = bodyValidation.data!;

        const taskDetail = await TaskDetail_Master.findByPk(id);
        
        if (!taskDetail) {
            return notFound(res, 'Task detail not found');
        }

        await taskDetail.update(updateData);
        
        const updatedTaskDetail = await TaskDetail_Master.findByPk(id);
        
        return updated(res, {
            success: true,
            message: 'Task detail updated successfully',
            data: updatedTaskDetail
        });

    } catch (error: any) {
        console.error('Error updating task detail:', error);
        return servError(res, error.message || 'Internal server error');
    }
};

// DELETE
export const deleteTaskDetail = async (req: Request, res: Response) => {
    try {
        const id = parseIdParam(req.params.id);
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID parameter'
            });
        }

        const validation = validateWithZod<{ id: number }>(taskDetailIdSchema, { id });
        
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        const taskDetail = await TaskDetail_Master.findByPk(id);
        
        if (!taskDetail) {
            return notFound(res, 'Task detail not found');
        }

        await taskDetail.destroy();
        
        return res.status(200).json({
            success: true,
            message: 'Task detail deleted successfully'
        });

    } catch (error: any) {
        console.error('Error deleting task detail:', error);
        return servError(res, error.message || 'Internal server error');
    }
};

// STATISTICS
export const getTaskDetailsStatistics = async (req: Request, res: Response) => {
    try {
        const totalRecords = await TaskDetail_Master.count();
        const recordsWithAN = await TaskDetail_Master.count({ where: { AN_No: { [Op.ne]: null } } });
        const recordsWithAssignedEmp = await TaskDetail_Master.count({ where: { Assigned_Emp_Id: { [Op.ne]: null } } });
        
        // Get status distribution
        const statusCounts = await TaskDetail_Master.findAll({
            attributes: ['Invovled_Stat', [sequelize.fn('COUNT', sequelize.col('Invovled_Stat')), 'count']],
            where: { Invovled_Stat: { [Op.ne]: null } },
            group: ['Invovled_Stat']
        });

        return res.status(200).json({
            success: true,
            message: 'Statistics retrieved successfully',
            data: {
                totalRecords,
                recordsWithAN,
                recordsWithAssignedEmp,
                recordsWithoutAN: totalRecords - recordsWithAN,
                recordsWithoutAssignedEmp: totalRecords - recordsWithAssignedEmp,
                statusDistribution: statusCounts
            }
        });

    } catch (error: any) {
        console.error('Error fetching statistics:', error);
        return servError(res, error.message || 'Internal server error');
    }
};



export const createTaskDetailsRaw = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();

  try {
    const validation = validateWithZod<TaskDetailCreateInput>(
      taskDetailCreateSchema,
      req.body
    );

    if (!validation.success) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors
      });
    }

    const {
      Project_Id,
      Sch_Id,
      Task_Id,
      Emp_Ids,
      Task_Levl_Id,
      Assigned_Emp_Id,
      Task_Assign_dt,
      Sch_Period,
      Sch_Time,
      EN_Time,
      Ord_By,
      Invovled_Stat
    } = validation.data!;


    const [maxAnNoResult] = await sequelize.query(
      `
      SELECT ISNULL(MAX(AN_No), 0) AS maxANNo
      FROM tbl_Task_Details
      `,
      { transaction }
    );

    const [maxIdResult] = await sequelize.query(
      `
      SELECT ISNULL(MAX(Id), 0) AS maxId
      FROM tbl_Task_Details 
      `,
      { transaction }
    );

    let nextANNo = ((maxAnNoResult as Array<{ maxANNo: number }>)[0]?.maxANNo ?? 0) + 1;
    let nextId   = ((maxIdResult   as Array<{ maxId:   number }>)[0]?.maxId   ?? 0) + 1;



    const insertedAN_NoValues: number[] = [];

    for (let i = 0; i < Emp_Ids.length; i++) {

      await sequelize.query(
        `
        INSERT INTO tbl_Task_Details
        (
          AN_No,
          Project_Id,
          Sch_Id,
          Task_Levl_Id,
          Task_Id,
          Assigned_Emp_Id,
          Emp_Id,
          Task_Assign_dt,
          Sch_Period,
          Sch_Time,
          EN_Time,
          Ord_By,
          Invovled_Stat
        )
        VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        {
          replacements: [
            nextANNo,
            Project_Id,
            Sch_Id,
            Task_Levl_Id     || null,
            Task_Id,
            Assigned_Emp_Id  || null,
            Emp_Ids[i],
            Task_Assign_dt   || new Date(),
            Sch_Period       || null,
            Sch_Time         || null,
            EN_Time          || null,
            Ord_By           || null,
            Invovled_Stat    || null
          ],
          transaction
        }
      );

      insertedAN_NoValues.push(nextANNo);

    
      nextANNo++;
      nextId++;
    }

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: `Task details created successfully for ${Emp_Ids.length} employee(s)`,
      data: {
        totalRecords: Emp_Ids.length,
        employeeIds: Emp_Ids,
        anNoValuesUsed: insertedAN_NoValues
      }
    });

  } catch (error: any) {
    await transaction.rollback();
    console.error("Error creating task details:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};
