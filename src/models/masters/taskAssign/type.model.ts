
// import { DataTypes, Model, Optional } from 'sequelize';
// import { sequelize } from '../../../config/sequalizer';
// import { z } from 'zod';

// const modelName = 'Project_Employee';



// export interface TaskAssignAttributes {
//   Id: number;
//   Project_Id: number;
//   User_Id: number;
// }

// export type TaskAssignCreationAttributes = Optional<TaskAssignAttributes, 'Id'>;
// export type TaskAssignUpdateAttributes = Partial<TaskAssignAttributes>;



// export class TaskAssign_Master
//   extends Model<TaskAssignAttributes, TaskAssignCreationAttributes>
//   implements TaskAssignAttributes {

//   declare Id: number;
//   declare Project_Id: number;
//   declare User_Id: number;

//   declare Project?: any;
//   declare Employee?: any;
// }



// export const taskAssignCreationSchema = z.object({
//   Project_Id: z.coerce.number().int().positive(),
//   User_Id: z.coerce.number().int().positive()
// }).strict();


// export const taskAssignUpdateSchema = z.object({
//   Project_Id: z.coerce.number().int().positive().optional(),
//   User_Id: z.coerce.number().int().positive().optional()
// }).strict();


// export const taskAssignQuerySchema = z.object({
//   projectId: z.coerce.number().int().positive().optional(),
//   userId: z.coerce.number().int().positive().optional()
// }).strict();


// export const taskAssignIdSchema = z.object({
//   id: z.coerce.number().int().positive()
// }).strict();




// export const taskAssignBulkCreateSchema = z.array(
//   z.object({
//     Project_Id: z.number().int().positive(),
//     User_Id: z.number().int().positive()
//   }).strict()
// ).min(1).max(100);


// export const taskAssignBulkUpdateSchema = z.array(
//   z.object({
//     Project_Id: z.number().int().positive(),
//     User_Id: z.number().int().positive()
//   })
// ).min(1, "At least one assignment is required");



// export type TaskAssignCreateInput = z.infer<typeof taskAssignCreationSchema>;
// export type TaskAssignUpdateInput = z.infer<typeof taskAssignUpdateSchema>;
// export type TaskAssignQueryParams = z.infer<typeof taskAssignQuerySchema>;

// export type TaskAssignBulkUpdateInput = z.infer<
//   typeof taskAssignBulkUpdateSchema
// >;



// TaskAssign_Master.init(
//   {
//     Id: {
//       type: DataTypes.BIGINT,
//       autoIncrement: true,
//       primaryKey: true
//     },
//     Project_Id: {
//       type: DataTypes.BIGINT,
//       allowNull: false
//     },
//     User_Id: {
//       type: DataTypes.INTEGER,
//       allowNull: false
//     }
//   },
//   {
//     sequelize,
//     tableName: 'tbl_Project_Employee',
//     modelName,
//     timestamps: false,
//     freezeTableName: true
//   }
// );



// import { Project_Master } from '../project/type.model';
// import { Employee_Master } from '../employee/type.model';


// TaskAssign_Master.belongsTo(Project_Master, {
//   foreignKey: 'Project_Id',
//   targetKey: 'Project_Id',
//   as: 'Project'
// });

// TaskAssign_Master.belongsTo(Employee_Master, {
//   foreignKey: 'User_Id',
//   targetKey: 'Emp_Id',
//   as: 'Employee'
// });


// Project_Master.hasMany(TaskAssign_Master, {
//   foreignKey: 'Project_Id',
//   sourceKey: 'Project_Id',
//   as: 'Assignments'
// });

// Employee_Master.hasMany(TaskAssign_Master, {
//   foreignKey: 'User_Id',
//   sourceKey: 'Emp_Id',
//   as: 'Assignments'
// });
// export const taskAssignBulkDeleteSchema = z.array(
//   z.number().int().positive()
// ).min(1).max(100);
