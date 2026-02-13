// import { Request, Response } from 'express';
// import {
//   created,
//   updated,
//   deleted,
//   servError,
//   notFound
// } from '../../../responseObject';

// import {
//   TaskAssign_Master,
//   taskAssignCreationSchema,
//   taskAssignUpdateSchema,
//   taskAssignQuerySchema,
//   taskAssignIdSchema,
//   TaskAssignCreateInput,
//   TaskAssignUpdateInput,
//   TaskAssignQueryParams,
//   taskAssignBulkCreateSchema,
//   taskAssignBulkUpdateSchema,
//   taskAssignBulkDeleteSchema
// } from '../../../models/masters/taskAssign/type.model';

// import { ProjectMaster } from '../../../models/masters/project/type.model';
// import { Employee_Master } from '../../../models/masters/employee/type.model';

// import { ZodError } from 'zod';
// import { Op, Transaction } from 'sequelize';
// import {sequelize} from '../../../config/sequalizer';

// const validateWithZod = <T>(schema: any, data: any): {
//   success: boolean;
//   data?: T;
//   errors?: Array<{ field: string; message: string }>
// } => {
//   try {
//     return { success: true, data: schema.parse(data) };
//   } catch (error: any) {
//     if (error instanceof ZodError) {
//       return {
//         success: false,
//         errors: error.issues.map(err => ({
//           field: err.path.join('.'),
//           message: err.message
//         }))
//       };
//     }
//     return { success: false };
//   }
// };


// interface UpdateError {
//   id: number;
//   error: string;
// }

// export const createBulkTaskAssign = async (req: Request, res: Response) => {
//   let transaction: Transaction | undefined;
  
//   try {

//     const validation = validateWithZod<TaskAssignCreateInput[]>(
//       taskAssignBulkCreateSchema,
//       req.body
//     );

//     if (!validation.success) {
//       return res.status(400).json({
//         success: false,
//         errors: validation.errors
//       });
//     }

//     const assignments = validation.data!;
//     transaction = await sequelize.transaction();

//     // Check for existing assignments to avoid duplicates
//     const existingAssignments = await TaskAssign_Master.findAll({
//       where: {
//         [Op.or]: assignments.map(assign => ({
//           Project_Id: assign.Project_Id,
//           User_Id: assign.User_Id
//         }))
//       },
//       transaction
//     });

//     // Filter out assignments that already exist
//     const newAssignments = assignments.filter(assign => 
//       !existingAssignments.some(existing => 
//         existing.Project_Id === assign.Project_Id && existing.User_Id === assign.User_Id
//       )
//     );

//     if (newAssignments.length === 0) {
//       await transaction.rollback();
//       return res.status(409).json({
//         success: false,
//         message: 'All employees are already assigned to their respective projects'
//       });
//     }

//     // Create new assignments
//     const createdRecords = await TaskAssign_Master.bulkCreate(newAssignments, {
//       transaction,
//       returning: true
//     });

//     await transaction.commit();

//     return res.status(201).json({
//       success: true,
//       message: `${createdRecords.length} assignment(s) created successfully`,
//       data: createdRecords,
//       skipped: assignments.length - newAssignments.length,
//       skippedAssignments: assignments.filter(assign => 
//         existingAssignments.some(existing => 
//           existing.Project_Id === assign.Project_Id && existing.User_Id === assign.User_Id
//         )
//       )
//     });

//   } catch (error: any) {
//     if (transaction) await transaction.rollback();
//     console.error('createBulkTaskAssign error:', error);
//     return servError(error, res);
//   }
// };

// export const updateBulkTaskAssign = async (req: Request, res: Response) => {
//   let transaction: Transaction | undefined;

//   try {

//     const parsed = taskAssignBulkUpdateSchema.safeParse(req.body);
 
//     if (!parsed.success) {
//       return res.status(400).json({
//         success: false,
//         message: "Validation error",
//         errors: parsed.error.format()
//       });
//     }

//     const updates = parsed.data;

   
//     const projectMap = new Map<number, number[]>();
//     for (const { Project_Id, User_Id } of updates) {
//       if (!projectMap.has(Project_Id)) projectMap.set(Project_Id, []);
//       projectMap.get(Project_Id)!.push(User_Id);
//     }

//     transaction = await sequelize.transaction();
//     const results: any[] = [];

   
//     for (const [Project_Id, userIds] of projectMap.entries()) {
     
//       const deletedCount = await TaskAssign_Master.destroy({
//         where: { Project_Id },
//         transaction
//       });

     
//       const uniqueUserIds = [...new Set(userIds)];

    
//       const rows = uniqueUserIds.map(User_Id => ({ Project_Id, User_Id }));
//       const created = await TaskAssign_Master.bulkCreate(rows, { transaction });

//       results.push({
//         Project_Id,
//         deletedCount,
//         createdCount: created.length
//       });
//     }

//     await transaction.commit();

  
//     return res.status(200).json({
//       success: true,
//       message: "Project assignments updated successfully",
//       summary: {
//         totalProjects: results.length,
//         totalDeleted: results.reduce((s, r) => s + r.deletedCount, 0),
//         totalCreated: results.reduce((s, r) => s + r.createdCount, 0)
//       },
//       details: results
//     });

//   } catch (error: any) {
//     if (transaction) await transaction.rollback();
//     console.error("updateBulkTaskAssign error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message
//     });
//   }
// };






// export const deleteBulkTaskAssign = async (req: Request, res: Response) => {
//   let transaction: Transaction | undefined;
  
//   try {
//     // Handle different request formats
//     let ids: number[];
    
//     // Check if the request has an 'ids' property or is directly an array
//     if (req.body.ids && Array.isArray(req.body.ids)) {
//       ids = req.body.ids;
//     } else if (Array.isArray(req.body)) {
//       ids = req.body;
//     } else {
//       return res.status(400).json({
//         success: false,
//         message: 'Request body must contain an array of IDs or an object with an "ids" array property'
//       });
//     }

//     // Validate input array of IDs
//     const validation = validateWithZod<number[]>(
//       taskAssignBulkDeleteSchema,
//       ids
//     );

//     if (!validation.success) {
//       return res.status(400).json({
//         success: false,
//         errors: validation.errors
//       });
//     }

//     ids = validation.data!;
//     transaction = await sequelize.transaction();

//     // Check if all IDs exist
//     const existingAssignments = await TaskAssign_Master.findAll({
//       where: { Id: { [Op.in]: ids } },
//       transaction
//     });

//     const existingIds = existingAssignments.map(assign => assign.Id);
//     const missingIds = ids.filter(id => !existingIds.includes(id));

//     if (existingIds.length === 0) {
//       await transaction.rollback();
//       return res.status(404).json({
//         success: false,
//         message: 'No assignments found with the provided IDs',
//         missingIds: ids
//       });
//     }

//     // Delete assignments
//     const deleteCount = await TaskAssign_Master.destroy({
//       where: { Id: { [Op.in]: existingIds } },
//       transaction
//     });

//     await transaction.commit();

//     return res.status(200).json({
//       success: true,
//       message: `${deleteCount} assignment(s) deleted successfully`,
//       deletedCount: deleteCount,
//       notFoundIds: missingIds.length > 0 ? missingIds : undefined
//     });

//   } catch (error: any) {
//     if (transaction) await transaction.rollback();
//     console.error('deleteBulkTaskAssign error:', error);
//     return servError(error, res);
//   }
// };


// export const getAllTaskAssign = async (req: Request, res: Response) => {
//   try {

//     const queryToValidate: any = {};
    
//     if (req.query.projectId) {
//       queryToValidate.projectId = req.query.projectId;
//     }
    
//     if (req.query.userId) {
//       queryToValidate.userId = req.query.userId;
//     }

//     const validation = validateWithZod<TaskAssignQueryParams>(
//       taskAssignQuerySchema,
//       queryToValidate  // Only pass the filtered params
//     );

//     if (!validation.success) {
//       return res.status(400).json({ success: false, errors: validation.errors });
//     }

//     const queryParams = validation.data!;
    
//     const whereConditions: string[] = [];
//     const params: any[] = [];
    
//     if (queryParams.projectId) {
//       whereConditions.push('pe.Project_Id = ?');
//       params.push(queryParams.projectId);
//     }
    
//     if (queryParams.userId) {
//       whereConditions.push('pe.User_Id = ?');
//       params.push(queryParams.userId);
//     }
    
//     const whereClause = whereConditions.length > 0 
//       ? `WHERE ${whereConditions.join(' AND ')}` 
//       : '';
    
//     // Simple query without pagination
//     const query = `
//       SELECT 
//         pe.Id,
//         pe.Project_Id,
//         pe.User_Id,
//         pm.Project_Name,
//         em.Emp_Name
//       FROM tbl_Project_Employee pe
//       LEFT JOIN tbl_Project_Master pm ON pe.Project_Id = pm.Project_Id
//       LEFT JOIN tbl_Employee_Master em ON pe.User_Id = em.Emp_Id
//       ${whereClause}
//       ORDER BY pe.Id ASC
//     `;
    
//     // Execute query
//     const [rows] = await sequelize.query(query, {
//       replacements: params
//     });
    
//     // Extract data
//     const dataRows = Array.isArray(rows) ? rows : [];
    
//     // Format response
//     const formattedData = dataRows.map((row: any) => ({
//       Id: row.Id,
//       Project_Id: row.Project_Id,
//       User_Id: row.User_Id,
//       Project: {
//         Project_Id: row.Project_Id,
//         Project_Name: row.Project_Name || 'Unknown Project'
//       },
//       Employee: {
//         Emp_Id: row.User_Id,
//         Emp_Name: row.Emp_Name || 'Unknown Employee'
//       }
//     }));

//     return res.json({
//       success: true,
//       data: formattedData
//     });

//   } catch (error: any) {
//     console.error('getAllTaskAssign error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Request Failed',
//       error: error.message
//     });
//   }
// };
// export const getTaskAssignById = async (req: Request, res: Response) => {
//   try {
//     const validation = validateWithZod<{ id: number }>(taskAssignIdSchema, req.params);
//     if (!validation.success) {
//       return res.status(400).json({ success: false, errors: validation.errors });
//     }

//     const taskAssignId = validation.data!.id;

//     const taskAssign = await TaskAssign_Master.findByPk(taskAssignId, {
//       include: [
//         {
//           model: ProjectMaster,
//           as: 'Project',
//           attributes: ['Project_Id', 'Project_Name']
//         }
//       ]
//     });

//     if (!taskAssign) return notFound(res, 'Task assignment not found');

//     const projectId = taskAssign.Project_Id;

//     const employees = await TaskAssign_Master.findAll({
//       where: { Project_Id: projectId },
//       include: [
//         {
//           model: Employee_Master,
//           as: 'Employee',
//           attributes: ['Emp_Id', 'Emp_Name']
//         }
//       ]
//     });

//     const employeeDetails = employees.map(e => ({
//       User_Id: e.User_Id,
//       Employee_Name: e.Employee?.Emp_Name || null
//     }));

//     return res.status(200).json({
//       success: true,
//       data: {
//         Project_Id: taskAssign.Project_Id,
//         Project_Name: taskAssign.Project?.Project_Name || null,
//         Employees: employeeDetails
//       }
//     });

//   } catch (error: any) {
//     console.error('getTaskAssignById error:', error);
//     return servError(error, res);
//   }
// };

// export const createTaskAssign = async (req: Request, res: Response) => {
//   try {
//     const validation = validateWithZod<TaskAssignCreateInput>(
//       taskAssignCreationSchema,
//       req.body
//     );

//     if (!validation.success) {
//       return res.status(400).json({
//         success: false,
//         errors: validation.errors
//       });
//     }

//     const exists = await TaskAssign_Master.findOne({
//       where: validation.data
//     });

//     if (exists) {
//       return res.status(409).json({
//         success: false,
//         message: 'User already assigned to this project'
//       });
//     }

//     const record = await TaskAssign_Master.create(validation.data);
//     return created(res, record);

//   } catch (error: any) {
//     return servError(error, res);
//   }
// };

// export const updateTaskAssign = async (req: Request, res: Response) => {
//   try {
//     const idValidation = validateWithZod<{ id: number }>(
//       taskAssignIdSchema,
//       req.params
//     );

//     if (!idValidation.success) {
//       return res.status(400).json({ success: false });
//     }

//     const taskAssign = await TaskAssign_Master.findByPk(idValidation.data!.id);
//     if (!taskAssign) {
//       return notFound(res, 'Task assignment not found');
//     }

//     const validation = validateWithZod<TaskAssignUpdateInput>(
//       taskAssignUpdateSchema,
//       req.body
//     );

//     if (!validation.success) {
//       return res.status(400).json({
//         success: false,
//         errors: validation.errors
//       });
//     }

//     await taskAssign.update(validation.data!);
//     return updated(res, taskAssign);

//   } catch (error: any) {
//     return servError(error, res);
//   }
// };

// export const deleteTaskAssign = async (req: Request, res: Response) => {
//   try {
//     const validation = validateWithZod<{ id: number }>(
//       taskAssignIdSchema,
//       req.params
//     );

//     if (!validation.success) {
//       return res.status(400).json({ success: false });
//     }

//     const taskAssign = await TaskAssign_Master.findByPk(validation.data!.id);
//     if (!taskAssign) {
//       return notFound(res, 'Task assignment not found');
//     }

//     await taskAssign.destroy();
//     return deleted(res);

//   } catch (error: any) {
//     return servError(error, res);
//   }
// };