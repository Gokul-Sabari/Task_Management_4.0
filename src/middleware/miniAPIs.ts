import sql, { ConnectionPool as MSSQLConnectionPool, Request } from 'mssql';
import { checkIsNumber, isEqualNumber } from '../helper_functions';
import dotenv from 'dotenv';
dotenv.config();

// Type definitions
interface MiniResponseParams {
    status?: boolean;
    dataArray?: any[];
    dataObject?: Record<string, any>;
    others?: Record<string, any>;
}

interface MiniResponse {
    status: boolean;
    dataArray: any[];
    dataObject: Record<string, any>;
    [key: string]: any;
}

interface UserTypeRecord {
    Id: number;
}

interface CustomerIdRecord {
    Cust_Id: number;
}

interface UserIdRecord {
    UserId: number;
}

interface MenuRights {
    id?: number;
    Read_Rights: number;
    Add_Rights: number;
    Edit_Rights: number;
    Delete_Rights: number;
    Print_Rights: number;
    [key: string]: any;
}

interface RetailerInfo {
    Retailer_Id?: number;
    RouteGet?: string;
    AreaGet?: string;
    StateGet?: string;
    Company_Name?: string;
    lastModifiedBy?: string;
    createdBy?: string;
    VERIFIED_LOCATION?: string;
    [key: string]: any;
}

interface ProductInfo {
    Product_Id?: number;
    Brand_Name: string;
    Pro_Group: string;
    Units: string;
    Item_Rate: number;
    Pack: number;
    [key: string]: any;
}

interface NextIdParams {
    table: string;
    column: string;
}

interface NextIdResponse {
    MaxId?: number;
    error?: any;
}

interface LOLRecord {
    [key: string]: any;
}

interface LOSRecord {
    [key: string]: any;
}

interface StreamRequest extends Request {
    stream: boolean;
    on(event: 'row', listener: (row: any) => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'done', listener: () => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
}

const userPortalDB: string | undefined = process.env.USERPORTALDB;

const miniResponse = ({ 
    status = true, 
    dataArray = [], 
    dataObject = {}, 
    others = {} 
}: MiniResponseParams): MiniResponse => ({ 
    status, 
    dataArray, 
    dataObject, 
    ...others 
});

export const getUserType = async (UserId: any): Promise<number | false> => {
    if (!checkIsNumber(UserId)) {
        return false;
    }

    try {
        const userTypeDetails = (await new sql.Request()
            .input('UserId', UserId)
            .query(`
            SELECT 
                ut.Id
            FROM 
                tbl_Users AS u,
                tbl_User_Type AS ut
            WHERE 
                u.UserId = @UserId
                AND
                u.UserTypeId = ut.Id
        `)
        ).recordset as UserTypeRecord[];

        if (userTypeDetails.length > 0 && Boolean(Number(userTypeDetails[0].Id))) {
            return Number(userTypeDetails[0].Id);
        } else {
            return false;
        }
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const getUserTypeByAuth = async (Auth: string): Promise<number | false> => {
    if (!Auth) {
        return false;
    }

    try {
        const userTypeDetails = (
            await new sql.Request()
                .input('Auth', Auth)
                .query(`
                SELECT ut.Id
                FROM 
                    tbl_Users AS u,
                    tbl_User_Type AS ut
                WHERE 
                    u.Autheticate_Id = @Auth
                    AND
                    u.UserTypeId = ut.Id`
                )).recordset as UserTypeRecord[];

        if (userTypeDetails.length > 0) {
            return Number(userTypeDetails[0].Id);
        } else {
            return false;
        }
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const getCUstomerIdByUserId = async (UserId: any): Promise<number | false> => {
    if (!checkIsNumber(UserId)) {
        return false;
    }

    try {
        const CustIdGet = (
            await new sql.Request()
                .input('UserId', UserId)
                .query(`
                SELECT cm.Cust_Id
                FROM 
                    tbl_Users AS u,
                    tbl_Customer_Master AS cm
                WHERE 
                    cm.User_Mgt_Id = @UserId
                    AND
                    u.UserId = cm.User_Mgt_Id`
                )).recordset as CustomerIdRecord[];

        if (CustIdGet.length > 0 && Boolean(Number(CustIdGet[0].Cust_Id))) {
            return Number(CustIdGet[0].Cust_Id);
        } else {
            return false;
        }
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const getUserIdByAuth = async (Auth: string): Promise<number | false> => {
    if (!Auth) {
        return false;
    }

    try {
        const getUserId = (await new sql.Request()
            .input('Auth', Auth)
            .query(`
            SELECT 
                UserId
            FROM 
                tbl_Users
            WHERE 
                Autheticate_Id = @Auth
        `)
        ).recordset as UserIdRecord[];

        if (getUserId.length > 0) {
            return Number(getUserId[0].UserId);
        } else {
            return false;
        }
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const getUserTypeBasedRights = async (usertype: number): Promise<MenuRights[] | false> => {
    try {
        const getUserTypeRights = new sql.Request()
            .input('usertype', usertype)
            .query(`
                SELECT 
                    m.*,
                    COALESCE(utr.Read_Rights, 0) AS Read_Rights,
                    COALESCE(utr.Add_Rights, 0) AS Add_Rights,
                    COALESCE(utr.Edit_Rights, 0) AS Edit_Rights,
                    COALESCE(utr.Delete_Rights, 0) AS Delete_Rights,
                    COALESCE(utr.Print_Rights, 0) AS Print_Rights
                FROM 
                    [${userPortalDB}].[dbo].[tbl_AppMenu] m
                LEFT JOIN 
                    tbl_AppMenu_UserTypeRights utr ON utr.UserTypeId = @usertype AND utr.MenuId = m.id`
            );

        const result = await getUserTypeRights;

        return result.recordset as MenuRights[];
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const getUserBasedRights = async (userid: number): Promise<MenuRights[] | false> => {
    if (!userid) {
        return false;
    }

    try {
        const getUserRights = new sql.Request()
            .input('userid', userid)
            .query(`
                SELECT 
                    m.*,
                    COALESCE(ur.Read_Rights, 0) AS Read_Rights,
                    COALESCE(ur.Add_Rights, 0) AS Add_Rights,
                    COALESCE(ur.Edit_Rights, 0) AS Edit_Rights,
                    COALESCE(ur.Delete_Rights, 0) AS Delete_Rights,
                    COALESCE(ur.Print_Rights, 0) AS Print_Rights
                FROM 
                    [${userPortalDB}].[dbo].[tbl_AppMenu] m
                LEFT JOIN 
                    tbl_AppMenu_UserRights ur ON ur.UserId = @userid AND ur.MenuId = m.id`
            );

        const result = await getUserRights;

        return result.recordset as MenuRights[];
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const getUserMenuRights = async (Auth: string): Promise<MenuRights[] | false> => {
    try {
        const UserTypeId = await getUserTypeByAuth(Auth);

        // for admin and management user have all permissions
        if (isEqualNumber(UserTypeId, 0) || isEqualNumber(UserTypeId, 1)) {
            const request = new sql.Request().query(`
                SELECT 
                    *,
                    1 as Read_Rights,
                    1 as Add_Rights,
                    1 as Edit_Rights,
                    1 as Delete_Rights,
                    1 as Print_Rights
                FROM
                    [${userPortalDB}].[dbo].[tbl_AppMenu]`
            );

            const result = await request;

            return result.recordset as MenuRights[];
        } else {
            const UserId = await getUserIdByAuth(Auth);

            const request = new sql.Request()
                .input('userid', UserId)
                .input('usertype', UserTypeId)
                .query(`
                    SELECT 
                        m.*,
                        COALESCE(ur.Read_Rights, utr.Read_Rights, 0) AS Read_Rights,
                        COALESCE(ur.Add_Rights, utr.Add_Rights, 0) AS Add_Rights,
                        COALESCE(ur.Edit_Rights, utr.Edit_Rights, 0) AS Edit_Rights,
                        COALESCE(ur.Delete_Rights, utr.Delete_Rights, 0) AS Delete_Rights,
                        COALESCE(ur.Print_Rights, utr.Print_Rights, 0) AS Print_Rights
                    FROM 
                        [${userPortalDB}].[dbo].[tbl_AppMenu] m
                    LEFT JOIN 
                        tbl_AppMenu_UserRights ur ON ur.UserId = @userid AND ur.MenuId = m.id
                    LEFT JOIN 
                        tbl_AppMenu_UserTypeRights utr ON utr.UserTypeId = @usertype AND utr.MenuId = m.id`
                );

            const result = await request;
            return result.recordset as MenuRights[];
        }
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const getRetailerInfo = async (retailerId: number): Promise<MiniResponse> => {
    try {
        if (!checkIsNumber(retailerId)) {
            throw new Error('Retailer id not received');
        }
        const request = new sql.Request()
            .input('retail', retailerId)
            .query(`
                SELECT 
                    rm.*,
                    COALESCE(rom.Route_Name, '') AS RouteGet,
                    COALESCE(am.Area_Name, '') AS AreaGet,
                    COALESCE(sm.State_Name, '') AS StateGet,
                    COALESCE(cm.Company_Name, '') AS Company_Name,
                    COALESCE(modify.Name, '') AS lastModifiedBy,
                    COALESCE(created.Name, '') AS createdBy,
                    COALESCE((
                        SELECT 
                            TOP (1) *
                        FROM 
                            tbl_Retailers_Locations
                        WHERE
                            Retailer_Id = rm.Retailer_Id
                            AND
                            isActiveLocation = 1
                        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    ), '{}') AS VERIFIED_LOCATION
                FROM
                    tbl_Retailers_Master AS rm
                
                LEFT JOIN
                    tbl_Route_Master AS rom
                    ON rom.Route_Id = rm.Route_Id
                LEFT JOIN
                    tbl_Area_Master AS am
                    ON am.Area_Id = rm.Area_Id
                LEFT JOIN
                    tbl_State_Master AS sm
                    ON sm.State_Id = rm.State_Id
                LEFT JOIN
                    tbl_Company_Master AS cm
                    ON cm.Company_id = rm.Company_Id
                LEFT JOIN
                    tbl_Users AS modify
                    ON modify.UserId = rm.Updated_By
                LEFT JOIN
                    tbl_Users AS created
                    ON created.UserId = rm.Created_By
                
                WHERE
                    rm.Retailer_Id = @retail
                `);

        const result = await request;

        if (result.recordset.length > 0) {
            return miniResponse({
                status: true,
                dataObject: result.recordset[0] as RetailerInfo
            });
        } else {
            throw new Error('Retailer not found');
        }
    } catch (e) {
        console.error(e);
        return miniResponse({
            status: false,
        });
    }
};

export const getProducts = async (IS_Sold: number = 1): Promise<MiniResponse> => {
    try {
        const request = new sql.Request()
            .input('IS_Sold', IS_Sold)
            .query(`
            WITH RATE AS (
                SELECT * 
                FROM tbl_Pro_Rate_Master
            )
            SELECT 
                p.*,
                COALESCE(b.Brand_Name, 'NOT FOUND') AS Brand_Name,
                COALESCE(pg.Pro_Group, 'NOT FOUND') AS Pro_Group,
                COALESCE(u.Units, 'NOT FOUND') AS Units,
                COALESCE((
                    SELECT 
                        TOP (1) Product_Rate 
                    FROM 
                        RATE AS r
                    WHERE 
                        r.Product_Id = p.Product_Id
                    ORDER BY
                        CONVERT(DATETIME, r.Rate_Date) DESC
                ), 0) AS Item_Rate,
                TRY_CAST(ISNULL(pck.Pack, 0) AS DECIMAL(18, 2)) AS Pack
            FROM 
                tbl_Product_Master AS p
                LEFT JOIN tbl_Brand_Master AS b
                ON b.Brand_Id = p.Brand
                LEFT JOIN tbl_Product_Group AS pg
                ON pg.Pro_Group_Id = p.Product_Group
                LEFT JOIN tbl_UOM AS u
                ON u.Unit_Id = p.UOM_Id
                LEFT JOIN tbl_Pack_Master AS pck
                ON pck.Pack_Id = p.Pack_Id
            `);
            // WHERE
            //     p.IS_Sold = @IS_Sold ;
        const result = await request;

        if (result.recordset.length > 0) {
            return miniResponse({
                status: true,
                dataArray: result.recordset as ProductInfo[]
            });
        } else {
            throw new Error('No data');
        }
    } catch (e) {
        console.error(e);
        return miniResponse({
            status: false,
        });
    }
};

export const getNextId = async ({ table = '', column = '' }: NextIdParams): Promise<MiniResponse> => {
    try {
        if (!table || !column) {
            return miniResponse({
                status: false,
                others: {
                    error: 'Invalid Input'
                }
            });
        }

        const col = String(column);
        const tab = String(table);
        const request = new sql.Request()
            .query(`SELECT COALESCE(MAX(${col}), 0) AS MaxId FROM ${tab}`);

        const result = await request;

        if (result.recordset.length) {
            return miniResponse({
                status: true,
                others: {
                    MaxId: Number(result.recordset[0].MaxId) + 1
                }
            });
        }

        throw new Error('failed to get max id');
    } catch (e) {
        console.log(e);
        return miniResponse({
            status: false,
            others: {
                error: e
            }
        });
    }
};

export const getLargeData = async (exeQuery: string, db?: MSSQLConnectionPool): Promise<any[]> => {
    try {
        let request: StreamRequest;
        
        if (db) {
            // Create request from connection pool
            request = db.request() as StreamRequest;
        } else {
            // Create new request
            request = new sql.Request() as StreamRequest;
        }

        request.stream = true;

        request.query(exeQuery);

        return new Promise((resolve, reject) => {
            const rows: any[] = [];

            request.on('row', (row: any) => {
                rows.push(row);
            });

            request.on('error', (err: Error) => {
                reject(err);
            });

            request.on('done', () => {
                resolve(rows);
            });
        });
    } catch (e) {
        console.error('ERROR in middleware getLargeData: ', e);
        return [];
    }
};

export const getLOL = async (db: MSSQLConnectionPool): Promise<MiniResponse> => {
    if (!db) return miniResponse({ status: false, others: { Err: 'db config is missing' } });

    try {
        const result = await getLargeData(
            `SELECT * FROM tbl_LOL_Excel`, db
        );

        if (result.length > 0) {
            return miniResponse({
                status: true,
                dataArray: result as LOLRecord[],
            });
        } else {
            return miniResponse({
                status: false,
                others: {
                    message: 'LOL data not found'
                }
            });
        }
    } catch (e) {
        console.log(e);
        return miniResponse({ status: false, others: { Err: 'Failed to fetch LOL' } });
    }
};

export const getLOS = async (db: MSSQLConnectionPool): Promise<MiniResponse> => {
    if (!db) return miniResponse({ status: false, others: { Err: 'db config is missing' } });

    try {
        const result = await getLargeData(
            `SELECT * FROM tbl_LOS_Excel`, db
        );

        if (result.length > 0) {
            return miniResponse({
                status: true,
                dataArray: result as LOSRecord[],
            });
        } else {
            return miniResponse({
                status: false,
                others: {
                    message: 'LOS data not found'
                }
            });
        }
    } catch (e) {
        console.log(e);
        return miniResponse({ status: false, others: { Err: 'Failed to fetch LOS' } });
    }
};