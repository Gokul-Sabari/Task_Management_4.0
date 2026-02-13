import { Request, Response } from 'express';
import {
    created,
    updated,
    deleted,
    servError,
    notFound,
    sentData
} from '../../../responseObject';
import {
    ParamMasterCreationSchema,
    ParamMasterUpdateSchema,
    ParamMasterQuerySchema,
    paramMasterIdSchema,
    ParamMasterCreate,
    ParamMasterUpdate,
    ParamMasterQuery
} from '../../../models/masters/parametMaster/type.model';
import { ZodError } from 'zod';
import { sequelize } from '../../../config/sequalizer';

/* -------------------- COMMON ZOD VALIDATION -------------------- */
const validateWithZod = <T>(schema: any, data: any): {
    success: boolean;
    data?: T;
    errors?: Array<{ field: string; message: string }>;
} => {
    try {
        return { success: true, data: schema.parse(data) };
    } catch (error) {
        if (error instanceof ZodError) {
            return {
                success: false,
                errors: error.issues.map(err => ({
                    field: err.path.join('.') || 'unknown',
                    message: err.message
                }))
            };
        }
        return {
            success: false,
            errors: [{ field: 'unknown', message: 'Validation failed' }]
        };
    }
};

/* -------------------- GET ALL -------------------- */
export const getAllParamMasters = async (req: Request, res: Response) => {
    try {
        const validation = validateWithZod<ParamMasterQuery>(
            ParamMasterQuerySchema,
            req.query
        );

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid query parameters',
                errors: validation.errors
            });
        }

        const { companyId, sortBy = 'Paramet_Id', sortOrder = 'ASC' } = validation.data!;
        const validSortFields = ['Paramet_Id', 'Paramet_Name', 'Paramet_Data_Type', 'Company_id'];

        if (!validSortFields.includes(sortBy)) {
            return res.status(400).json({ success: false, message: 'Invalid sort field' });
        }

        let where = 'WHERE Del_Flag = 0';
        const params: any[] = [];

        if (companyId) {
            where += ' AND Company_id = ?';
            params.push(companyId);
        }

        const query = `
            SELECT Paramet_Id, Paramet_Name, Paramet_Data_Type, Company_id, Del_Flag
            FROM tbl_Paramet_Master
            ${where}
            ORDER BY ${sortBy} ${sortOrder}
        `;

        const rows = await sequelize.query(query, {
            replacements: params,
            type: 'SELECT'
        }) as any[];

        sentData(res, rows);
    } catch (e) {
        servError(e, res);
    }
};

/* -------------------- GET BY ID -------------------- */
export const getParamMasterById = async (req: Request, res: Response) => {
    try {
        const validation = validateWithZod<{ id: number }>(
            paramMasterIdSchema,
            req.params
        );

        if (!validation.success) {
            return res.status(400).json({ success: false, errors: validation.errors });
        }

        const query = `
            SELECT *
            FROM tbl_Paramet_Master
            WHERE Paramet_Id = ? AND Del_Flag = 0
        `;

        const rows = await sequelize.query(query, {
            replacements: [validation.data!.id],
            type: 'SELECT'
        }) as any[];

        if (!rows.length) return notFound(res, 'Parameter Master not found');

        sentData(res, rows[0]);
    } catch (e) {
        servError(e, res);
    }
};

/* -------------------- CREATE (IDENTITY FIXED) -------------------- */
export const createParamMaster = async (req: Request, res: Response) => {
    try {
        const body = {
            ...req.body,
            Paramet_Name: req.body.Paramet_Name?.trim()
        };

        const validation = validateWithZod<ParamMasterCreate>(
            ParamMasterCreationSchema,
            body
        );

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        const { Paramet_Name, Paramet_Data_Type, Company_id } = validation.data!;

        // Duplicate check
        const dup = await sequelize.query(
            `SELECT 1 FROM tbl_Paramet_Master WHERE UPPER(Paramet_Name)=UPPER(?) AND Del_Flag=0`,
            { replacements: [Paramet_Name], type: 'SELECT' }
        ) as any[];

        if (dup.length) {
            return res.status(409).json({
                success: false,
                message: 'Parameter Master already exists'
            });
        }

        // ✅ Correct insert (NO Paramet_Id)
        const insertQuery = `
            INSERT INTO tbl_Paramet_Master
            (Paramet_Name, Paramet_Data_Type, Company_id, Del_Flag)
            OUTPUT INSERTED.Paramet_Id
            VALUES (?, ?, ?, 0)
        `;

        const result = await sequelize.query(insertQuery, {
            replacements: [Paramet_Name, Paramet_Data_Type ?? null, Company_id ?? null],
            type: 'SELECT'
        }) as any[];

        const insertedId = result[0].Paramet_Id;

        const data = await sequelize.query(
            `SELECT * FROM tbl_Paramet_Master WHERE Paramet_Id = ?`,
            { replacements: [insertedId], type: 'SELECT' }
        ) as any[];

        created(res, data[0], 'Parameter Master created successfully');
    } catch (e) {
        servError(e, res);
    }
};

/* -------------------- UPDATE -------------------- */
export const updateParamMaster = async (req: Request, res: Response) => {
    try {
        const idCheck = validateWithZod<{ id: number }>(paramMasterIdSchema, req.params);
        if (!idCheck.success) return res.status(400).json({ errors: idCheck.errors });

        const bodyCheck = validateWithZod<ParamMasterUpdate>(
            ParamMasterUpdateSchema,
            req.body
        );
        if (!bodyCheck.success) return res.status(400).json({ errors: bodyCheck.errors });

        const fields: string[] = [];
        const values: any[] = [];

        Object.entries(bodyCheck.data!).forEach(([k, v]) => {
            fields.push(`${k} = ?`);
            values.push(v);
        });

        if (!fields.length) {
            return res.status(400).json({ message: 'Nothing to update' });
        }

        values.push(idCheck.data!.id);

        await sequelize.query(
            `UPDATE tbl_Paramet_Master SET ${fields.join(', ')} WHERE Paramet_Id = ?`,
            { replacements: values }
        );

        updated(res, null, 'Parameter Master updated successfully');
    } catch (e) {
        servError(e, res);
    }
};

/* -------------------- DELETE (SOFT) -------------------- */
export const deleteParamMaster = async (req: Request, res: Response) => {
    try {
        const validation = validateWithZod<{ id: number }>(
            paramMasterIdSchema,
            req.params
        );
        if (!validation.success) return res.status(400).json({ errors: validation.errors });

        await sequelize.query(
            `UPDATE tbl_Paramet_Master SET Del_Flag = 1 WHERE Paramet_Id = ?`,
            { replacements: [validation.data!.id] }
        );

        deleted(res, 'Parameter Master deleted successfully');
    } catch (e) {
        servError(e, res);
    }
};

/* -------------------- ACTIVE LIST -------------------- */
export const getAllActiveParamMasters = async (_: Request, res: Response) => {
    try {
        const rows = await sequelize.query(
            `SELECT * FROM tbl_Paramet_Master WHERE Del_Flag = 0 ORDER BY Paramet_Name`,
            { type: 'SELECT' }
        ) as any[];

        sentData(res, rows);
    } catch (e) {
        servError(e, res);
    }
};
