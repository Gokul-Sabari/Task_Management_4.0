import sql from "mssql";
import { z } from "zod";
import { Request, Response } from "express";
import { ApiMenuRow, mapDbToApi, MenuRowDB, type MenuPayload } from "../types";
import dotenv from 'dotenv'
import { sentData, servError } from "../../../responseObject";
dotenv.config();

const appMenuTable = '[' + (process.env.USERPORTALDB || 'User_Portal_Test') + '].[dbo].[MenuMaster]';

export const menuSchema = z.object({
    parentId: z.number().int().nullable().optional().transform((v) => (v === undefined ? null : v)),
    slug: z.string().min(1).max(128).regex(/^[a-z0-9\-_/]+$/i),
    title: z.string().min(1).max(128),
    iconKey: z.string().max(64).nullable().optional().transform((v) => (v === undefined ? null : v)),
    menuType: z.number().int().min(0).max(3).default(0),
    isActive: z.boolean().default(true),
    isVisible: z.boolean().default(true),
    sortOrder: z.number().int().nullable().optional().transform((v) => (v === undefined ? null : v)),
    componentKey: z.string().max(128).nullable().optional().transform((v) => (v === undefined ? null : v)),
});

export function parseMenuPayload(body: any): MenuPayload {
    const parsed = menuSchema.parse(body);
    return parsed as MenuPayload;
}

async function ensureUniqueSlugUnderParent(parentId: number | null, slug: string, excludeId?: number) {
    const req = new sql.Request();
    req.input("ParentId", parentId === null ? null : parentId);
    req.input("Slug", sql.VarChar(128), slug);
    if (excludeId) req.input("ExcludeId", sql.Int, excludeId);
    const whereExclude = excludeId ? "AND MenuId <> @ExcludeId" : "";
    const { recordset } = await req.query(`
        SELECT COUNT(1) AS Cnt FROM ${appMenuTable}
        WHERE ((ParentId IS NULL AND @ParentId IS NULL) OR ParentId = @ParentId)
        AND Slug = @Slug ${whereExclude};`);
    const cnt = recordset?.[0]?.Cnt ?? 0;
    if (cnt > 0) {
        const err: any = new Error("Slug already exists under this parent");
        err.status = 409;
        throw err;
    }
}

async function ensureParentExists(parentId: number | null) {
    if (parentId === null) return;
    const request = new sql.Request()
        .input("ParentId", sql.Int, parentId)
        .query(`SELECT 1 FROM ${appMenuTable} WHERE MenuId = @ParentId`);

    const recordset = (await request).recordset;

    if (recordset.length === 0) {
        const err: any = new Error("Parent not found");
        err.status = 400;
        throw err;
    }
}

async function assertNoCycle(menuId: number, newParentId: number | null) {
    if (newParentId === null) return;
    if (newParentId === menuId) {
        const err: any = new Error("A menu cannot be its own parent");
        err.status = 400;
        throw err;
    }
    // Find any descendant of menuId matching newParentId
    const request = new sql.Request()
        .input("MenuId", sql.Int, menuId)
        .input("NewParentId", sql.Int, newParentId)
        .query(`
            ;WITH R AS (
            SELECT MenuId FROM ${appMenuTable} WHERE ParentId = @MenuId
            UNION ALL
            SELECT c.MenuId FROM ${appMenuTable} c JOIN R ON c.ParentId = R.MenuId
            )
            SELECT 1 AS Hit FROM R WHERE MenuId = @NewParentId;`
        );

    const recordset = (await request).recordset;

    if (recordset.length > 0) {
        const err: any = new Error("Parent cannot be a descendant (cycle detected)");
        err.status = 400;
        throw err;
    }
}

const getMenu = async (req: Request, res: Response) => {
    try {
        const result = await new sql.Request()
            .query<MenuRowDB>(`
                SELECT MenuId, ParentId, Slug, Title, IconKey, MenuType, IsActive, IsVisible, SortOrder, ComponentKey
                FROM ${appMenuTable}
                ORDER BY ISNULL(SortOrder, 1000), Title`
            );

        const rows: ApiMenuRow[] = result.recordset.map(mapDbToApi);
        sentData(res, rows);
    } catch (e) {
        servError(e, res);
    }
}

const createMenu = async (req: Request, res: Response) => {
    try {
        const payload = parseMenuPayload(req.body);
        await ensureParentExists(payload.parentId);
        await ensureUniqueSlugUnderParent(payload.parentId, payload.slug);

        const request = new sql.Request()
            .input("ParentId", sql.Int, payload.parentId)
            .input("Slug", sql.VarChar(128), payload.slug)
            .input("Title", sql.NVarChar(128), payload.title)
            .input("IconKey", sql.NVarChar(64), payload.iconKey)
            .input("MenuType", sql.TinyInt, payload.menuType)
            .input("IsActive", sql.Bit, payload.isActive)
            .input("IsVisible", sql.Bit, payload.isVisible)
            .input("SortOrder", sql.Int, payload.sortOrder)
            .input("ComponentKey", sql.NVarChar(128), payload.componentKey);


        const insert = await request.query<MenuRowDB>(`
            INSERT INTO ${appMenuTable} (
                ParentId, Slug, Title, IconKey, MenuType, IsActive, IsVisible, SortOrder, ComponentKey
            ) OUTPUT INSERTED.MenuId VALUES (
                @ParentId, @Slug, @Title, @IconKey, @MenuType, @IsActive, @IsVisible, @SortOrder, @ComponentKey
            );`
        );


        const newId: number = insert.recordset[0].MenuId;
        const row = await new sql.Request()
            .input("MenuId", sql.Int, newId)
            .query<MenuRowDB>(`
                SELECT MenuId, ParentId, Slug, Title, IconKey, MenuType, IsActive, IsVisible, SortOrder, ComponentKey
                FROM ${appMenuTable} WHERE MenuId = @MenuId`);
        res.status(201).json(mapDbToApi(row.recordset[0]));
    } catch (err: any) {
        console.error(err);
        res.status(err.status || 500).json({ error: err.message || "Create failed" });
    }
}

const updateMenu = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });

    try {
        const payload = parseMenuPayload(req.body);

        // ensure exists
        const exists = await new sql.Request()
            .input("MenuId", sql.Int, id)
            .query(`SELECT 1 FROM ${appMenuTable} WHERE MenuId = @MenuId`);

        if (exists.recordset.length === 0) return res.status(404).json({ error: "Menu not found" });

        await ensureParentExists(payload.parentId);
        await assertNoCycle(id, payload.parentId);
        await ensureUniqueSlugUnderParent(payload.parentId, payload.slug, id);


        await new sql.Request()
            .input("MenuId", sql.Int, id)
            .input("ParentId", sql.Int, payload.parentId)
            .input("Slug", sql.VarChar(128), payload.slug)
            .input("Title", sql.NVarChar(128), payload.title)
            .input("IconKey", sql.NVarChar(64), payload.iconKey)
            .input("MenuType", sql.TinyInt, payload.menuType)
            .input("IsActive", sql.Bit, payload.isActive)
            .input("IsVisible", sql.Bit, payload.isVisible)
            .input("SortOrder", sql.Int, payload.sortOrder)
            .input("ComponentKey", sql.NVarChar(128), payload.componentKey)
            .query(`
                UPDATE ${appMenuTable}
                SET 
                    ParentId = @ParentId, 
                    Slug = @Slug, 
                    Title = @Title, 
                    IconKey = @IconKey, 
                    MenuType = @MenuType,
                    IsActive = @IsActive, 
                    IsVisible = @IsVisible, 
                    SortOrder = @SortOrder, 
                    ComponentKey = @ComponentKey,
                    UpdatedAt = SYSDATETIME()
                WHERE MenuId = @MenuId;`
            );


        const out = await new sql.Request()
            .input("MenuId", sql.Int, id)
            .query<MenuRowDB>(`
                SELECT MenuId, ParentId, Slug, Title, IconKey, MenuType, IsActive, IsVisible, SortOrder, ComponentKey
                FROM ${appMenuTable} WHERE MenuId = @MenuId`
            );

        res.json(mapDbToApi(out.recordset[0]));
    } catch (err: any) {
        console.error(err);
        res.status(err.status || 500).json({ error: err.message || "Update failed" });
    }
}

export default {
    getMenu,
    createMenu,
    updateMenu
}