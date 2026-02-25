

import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { sequelize } from '../../../config/sequalizer';
import TaskDetail_Master, {
  TaskDetailCreateInput,
  taskDetailCreateSchema,
  TaskDetailAttributes
} from '../../../models/masters/taskDetails/type.model';
import { Op } from 'sequelize';

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
 
      return {
        success: false,
       
      };
    }
    return {
      success: false,
      errors: [{ field: 'unknown', message: 'Validation failed' }]
    };
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