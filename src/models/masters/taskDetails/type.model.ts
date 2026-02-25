// import { DataTypes, Model, Optional } from 'sequelize';
// import { sequelize } from '../../../config/sequalizer';
// import { z } from 'zod';

// const modelName = 'Task_Detail';

// export interface TaskDetailAttributes {
//   Id: number;
//   AN_No?: number | null;
//   Project_Id: number;
//   Sch_Id: number;
//   Task_Levl_Id?: number | null;
//   Task_Id: number;
//   Assigned_Emp_Id?: number | null;
//   Emp_Id: number;
//   Task_Assign_dt?: Date | null;
//   Sch_Period?: string | null;
//   Sch_Time?: Date | null;
//   EN_Time?: Date | null;
//   Ord_By?: number | null;
//   Invovled_Stat?: number | null;
// }

// export type TaskDetailCreationAttributes = Optional<TaskDetailAttributes, 'Id'>;

// export class TaskDetail_Master extends Model<TaskDetailAttributes, TaskDetailCreationAttributes> {
//   declare Id: number;
//   declare AN_No: number | null;
//   declare Project_Id: number;
//   declare Sch_Id: number;
//   declare Task_Levl_Id: number | null;
//   declare Task_Id: number;
//   declare Assigned_Emp_Id: number | null;
//   declare Emp_Id: number;
//   declare Task_Assign_dt: Date | null;
//   declare Sch_Period: string | null;
//   declare Sch_Time: Date | null;
//   declare EN_Time: Date | null;
//   declare Ord_By: number | null;
//   declare Invovled_Stat: number | null;
// }

// // More flexible Zod Schema for Create API
// export const taskDetailCreateSchema = z.object({
//   AN_No: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional().transform(val => val ? Number(val) : null),
//   Project_Id: z.union([z.number(), z.string()]).transform(val => Number(val)),
//   Sch_Id: z.union([z.number(), z.string()]).transform(val => Number(val)),
//   Task_Levl_Id: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional().transform(val => val ? Number(val) : null),
//   Task_Id: z.union([z.number(), z.string()]).transform(val => Number(val)),
//   Assigned_Emp_Id: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional().transform(val => val ? Number(val) : null),
//   Emp_Ids: z.array(z.union([z.number(), z.string()])).min(1).max(100).transform(arr => arr.map(val => Number(val))),
//   Task_Assign_dt: z.union([z.string(), z.date(), z.null(), z.undefined()]).optional().transform(val => val ? new Date(val) : null),
//   Sch_Period: z.string().max(50).optional().nullable(),
//   Sch_Time: z.union([z.string(), z.date(), z.null(), z.undefined()]).optional().transform(val => val ? new Date(val) : null),
//   EN_Time: z.union([z.string(), z.date(), z.null(), z.undefined()]).optional().transform(val => val ? new Date(val) : null),
//   Ord_By: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional().transform(val => val ? Number(val) : null),
//   Invovled_Stat: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional().transform(val => val ? Number(val) : null)
// }).strict();

// export type TaskDetailCreateInput = z.infer<typeof taskDetailCreateSchema>;

// // Model initialization
// TaskDetail_Master.init(
//   {
//     Id: {
//       type: DataTypes.BIGINT,
//       autoIncrement: true,
//       primaryKey: true
//     },
//     AN_No: {
//       type: DataTypes.BIGINT,
//       allowNull: true
//     },
//     Project_Id: {
//       type: DataTypes.BIGINT,
//       allowNull: false
//     },
//     Sch_Id: {
//       type: DataTypes.BIGINT,
//       allowNull: false
//     },
//     Task_Levl_Id: {
//       type: DataTypes.BIGINT,
//       allowNull: true
//     },
//     Task_Id: {
//       type: DataTypes.BIGINT,
//       allowNull: false
//     },
//     Assigned_Emp_Id: {
//       type: DataTypes.INTEGER,
//       allowNull: true
//     },
//     Emp_Id: {
//       type: DataTypes.INTEGER,
//       allowNull: false
//     },
//     Task_Assign_dt: {
//       type: DataTypes.DATE,
//       allowNull: true
//     },
//     Sch_Period: {
//       type: DataTypes.STRING(50),
//       allowNull: true
//     },
//     Sch_Time: {
//       type: DataTypes.DATE,
//       allowNull: true
//     },
//     EN_Time: {
//       type: DataTypes.DATE,
//       allowNull: true
//     },
//     Ord_By: {
//       type: DataTypes.INTEGER,
//       allowNull: true
//     },
//     Invovled_Stat: {
//       type: DataTypes.INTEGER,
//       allowNull: true
//     }
//   },
//   {
//     sequelize,
//     tableName: 'tbl_Task_Details',
//     modelName,
//     timestamps: false,
//     freezeTableName: true
//   }
// );

// export default TaskDetail_Master;






import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../config/sequalizer';
import { z } from 'zod';

const modelName = 'Task_Detail';

export interface TaskDetailAttributes {
  Id: number;
  AN_No?: number | null;
  Project_Id: number;
  Sch_Id: number;
  Task_Levl_Id?: number | null;
  Task_Id: number;
  Assigned_Emp_Id?: number | null;
  Emp_Id: number;
  Task_Assign_dt?: Date | null;
  Sch_Period?: string | null;
  Sch_Time?: Date | null;
  EN_Time?: Date | null;
  Ord_By?: number | null;
  Invovled_Stat?: number | null;
}

export type TaskDetailCreationAttributes = Optional<TaskDetailAttributes, 'Id'>;

export class TaskDetail_Master extends Model<TaskDetailAttributes, TaskDetailCreationAttributes> {
  declare Id: number;
  declare AN_No: number | null;
  declare Project_Id: number;
  declare Sch_Id: number;
  declare Task_Levl_Id: number | null;
  declare Task_Id: number;
  declare Assigned_Emp_Id: number | null;
  declare Emp_Id: number;
  declare Task_Assign_dt: Date | null;
  declare Sch_Period: string | null;
  declare Sch_Time: Date | null;
  declare EN_Time: Date | null;
  declare Ord_By: number | null;
  declare Invovled_Stat: number | null;
}

// More flexible Zod Schema for Create API
export const taskDetailCreateSchema = z.object({
  AN_No: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional().transform(val => val ? Number(val) : null),
  Project_Id: z.union([z.number(), z.string()]).transform(val => Number(val)),
  Sch_Id: z.union([z.number(), z.string()]).transform(val => Number(val)),
  Task_Levl_Id: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional().transform(val => val ? Number(val) : null),
  Task_Id: z.union([z.number(), z.string()]).transform(val => Number(val)),
  Assigned_Emp_Id: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional().transform(val => val ? Number(val) : null),
  Emp_Ids: z.array(z.union([z.number(), z.string()])).min(1).max(100).transform(arr => arr.map(val => Number(val))),
  Task_Assign_dt: z.union([z.string(), z.date(), z.null(), z.undefined()]).optional().transform(val => val ? new Date(val) : null),
  Sch_Period: z.string().max(50).optional().nullable(),
  Sch_Time: z.union([z.string(), z.date(), z.null(), z.undefined()]).optional().transform(val => val ? new Date(val) : null),
  EN_Time: z.union([z.string(), z.date(), z.null(), z.undefined()]).optional().transform(val => val ? new Date(val) : null),
  Ord_By: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional().transform(val => val ? Number(val) : null),
  Invovled_Stat: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional().transform(val => val ? Number(val) : null)
}).strict();

export type TaskDetailCreateInput = z.infer<typeof taskDetailCreateSchema>;


export const taskDetailUpdateSchema = z.object({
  AN_No: z.union([z.number(), z.string(), z.null()]).optional().transform(val => val ? Number(val) : null),
  Project_Id: z.union([z.number(), z.string()]).optional().transform(val => val ? Number(val) : undefined),
  Sch_Id: z.union([z.number(), z.string()]).optional().transform(val => val ? Number(val) : undefined),
  Task_Levl_Id: z.union([z.number(), z.string(), z.null()]).optional().transform(val => val ? Number(val) : null),
  Task_Id: z.union([z.number(), z.string()]).optional().transform(val => val ? Number(val) : undefined),
  Assigned_Emp_Id: z.union([z.number(), z.string(), z.null()]).optional().transform(val => val ? Number(val) : null),
  Emp_Ids: z.array(z.union([z.number(), z.string()])).min(1).max(100).optional().transform(arr => arr ? arr.map(val => Number(val)) : undefined),
  Task_Assign_dt: z.union([z.string(), z.date(), z.null()]).optional().transform(val => val ? new Date(val) : null),
  Sch_Period: z.string().max(50).optional().nullable(),
  Sch_Time: z.union([z.string(), z.date(), z.null()]).optional().transform(val => val ? new Date(val) : null),
  EN_Time: z.union([z.string(), z.date(), z.null()]).optional().transform(val => val ? new Date(val) : null),
  Ord_By: z.union([z.number(), z.string(), z.null()]).optional().transform(val => val ? Number(val) : null),
  Invovled_Stat: z.union([z.number(), z.string(), z.null()]).optional().transform(val => val ? Number(val) : null)
}).strict().partial(); // .partial() makes all fields optional

export type TaskDetailUpdateInput = z.infer<typeof taskDetailUpdateSchema>;

export const taskDetailQuerySchema = z.object({
  // Pagination
  page: z.union([z.string(), z.number()]).optional().default(1).transform(val => Number(val)),
  limit: z.union([z.string(), z.number()]).optional().default(20).transform(val => Number(val)),
  
  // Filters
  Id: z.union([z.string(), z.number()]).optional().transform(val => val ? Number(val) : undefined),
  AN_No: z.union([z.string(), z.number()]).optional().transform(val => val ? Number(val) : undefined),
  Project_Id: z.union([z.string(), z.number()]).optional().transform(val => val ? Number(val) : undefined),
  Sch_Id: z.union([z.string(), z.number()]).optional().transform(val => val ? Number(val) : undefined),
  Task_Levl_Id: z.union([z.string(), z.number()]).optional().transform(val => val ? Number(val) : undefined),
  Task_Id: z.union([z.string(), z.number()]).optional().transform(val => val ? Number(val) : undefined),
  Assigned_Emp_Id: z.union([z.string(), z.number()]).optional().transform(val => val ? Number(val) : undefined),
  Emp_Id: z.union([z.string(), z.number()]).optional().transform(val => val ? Number(val) : undefined),
  Invovled_Stat: z.union([z.string(), z.number()]).optional().transform(val => val ? Number(val) : undefined),
  Ord_By: z.union([z.string(), z.number()]).optional().transform(val => val ? Number(val) : undefined),
  
  // Multiple IDs for IN queries
  Ids: z.union([
    z.string().transform(str => str.split(',').map(Number)),
    z.array(z.union([z.string(), z.number()])).transform(arr => arr.map(val => Number(val))),
    z.undefined()
  ]).optional(),
  
  Project_Ids: z.union([
    z.string().transform(str => str.split(',').map(Number)),
    z.array(z.union([z.string(), z.number()])).transform(arr => arr.map(val => Number(val))),
    z.undefined()
  ]).optional(),
  
  Task_Ids: z.union([
    z.string().transform(str => str.split(',').map(Number)),
    z.array(z.union([z.string(), z.number()])).transform(arr => arr.map(val => Number(val))),
    z.undefined()
  ]).optional(),
  
  Emp_Ids: z.union([
    z.string().transform(str => str.split(',').map(Number)),
    z.array(z.union([z.string(), z.number()])).transform(arr => arr.map(val => Number(val))),
    z.undefined()
  ]).optional(),
  
  // Date range filters
  from_Task_Assign_dt: z.union([z.string(), z.date()]).optional().transform(val => val ? new Date(val) : undefined),
  to_Task_Assign_dt: z.union([z.string(), z.date()]).optional().transform(val => val ? new Date(val) : undefined),
  
  from_Sch_Time: z.union([z.string(), z.date()]).optional().transform(val => val ? new Date(val) : undefined),
  to_Sch_Time: z.union([z.string(), z.date()]).optional().transform(val => val ? new Date(val) : undefined),
  
  from_EN_Time: z.union([z.string(), z.date()]).optional().transform(val => val ? new Date(val) : undefined),
  to_EN_Time: z.union([z.string(), z.date()]).optional().transform(val => val ? new Date(val) : undefined),
  
  // Status filters
  has_AN_No: z.union([z.string(), z.boolean()]).optional().transform(val => val === 'true' || val === true),
  has_Assigned_Emp: z.union([z.string(), z.boolean()]).optional().transform(val => val === 'true' || val === true),
  has_Task_Levl: z.union([z.string(), z.boolean()]).optional().transform(val => val === 'true' || val === true),
  
  // Sorting
  sortBy: z.enum([
    'Id', 'AN_No', 'Project_Id', 'Sch_Id', 'Task_Id', 'Emp_Id', 
    'Task_Assign_dt', 'Sch_Time', 'EN_Time', 'Invovled_Stat'
  ]).optional().default('Id'),
  
  sortOrder: z.enum(['ASC', 'DESC']).optional().default('DESC'),
  
  // Search
  search: z.string().optional(),
  
  // Export option
  export: z.union([z.string(), z.boolean()]).optional().transform(val => val === 'true' || val === true)
});

export type TaskDetailQueryParams = z.infer<typeof taskDetailQuerySchema>;

// ID validation schema for single record operations
export const taskDetailIdSchema = z.object({
  id: z.union([z.number(), z.string()]).transform(val => Number(val))
});



// Model initialization
TaskDetail_Master.init(
  {
    Id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    AN_No: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    Project_Id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    Sch_Id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    Task_Levl_Id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    Task_Id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    Assigned_Emp_Id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    Emp_Id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    Task_Assign_dt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    Sch_Period: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    Sch_Time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    EN_Time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    Ord_By: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    Invovled_Stat: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'tbl_Task_Details',
    modelName,
    timestamps: false,
    freezeTableName: true
  }
);

export default TaskDetail_Master;