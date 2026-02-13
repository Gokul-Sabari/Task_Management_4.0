import sql from 'mssql';
import dotenv from 'dotenv';
import { 
    MiniResponseParams, 
    MiniResponse, 
    GetNextIdParams, 
    RetailerInfo,
    Product,
    MenuRights 
} from './utility.types';

dotenv.config();

const userPortalDB: string | undefined = process.env.USERPORTALDB;

// Helper function to check if value is a valid number
export const checkIsNumber = (value: any): boolean => {
    if (value === null || value === undefined || value === '') return false;
    const num = Number(value);
    return !isNaN(num) && isFinite(num);
};

// Helper function to check if numbers are equal
export const isEqualNumber = (value1: any, value2: any): boolean => {
    const num1 = Number(value1);
    const num2 = Number(value2);
    if (isNaN(num1) || isNaN(num2)) return false;
    return num1 === num2;
};

export const miniResponse = ({ 
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

export const getUserType = async (UserId: string | number): Promise<number | false> => {
    if (!checkIsNumber(UserId)) {
        return false;
    }

    try {
        const request = new sql.Request();
        request.input('UserId', sql.Int, UserId);
        
        const result = await request.query<{ Id: number }>(`
            SELECT 
                ut.Id
            FROM 
                tbl_Users AS u
            INNER JOIN 
                tbl_User_Type AS ut ON u.UserTypeId = ut.Id
            WHERE 
                u.UserId = @UserId
        `);

        const userTypeDetails = result.recordset;

        if (userTypeDetails.length > 0 && userTypeDetails[0].Id) {
            return Number(userTypeDetails[0].Id);
        }
        return false;
    } catch (e) {
        console.error('Error in getUserType:', e);
        return false;
    }
};

export const getUserTypeByAuth = async (Auth: string): Promise<number | false> => {
    if (!Auth) {
        return false;
    }

    try {
        const request = new sql.Request();
        request.input('Auth', sql.NVarChar, Auth);
        
        const result = await request.query<{ Id: number }>(`
            SELECT ut.Id
            FROM 
                tbl_Users AS u
            INNER JOIN 
                tbl_User_Type AS ut ON u.UserTypeId = ut.Id
            WHERE 
                u.Authenticate_Id = @Auth
        `);

        const userTypeDetails = result.recordset;

        if (userTypeDetails.length > 0) {
            return Number(userTypeDetails[0].Id);
        }
        return false;
    } catch (e) {
        console.error('Error in getUserTypeByAuth:', e);
        return false;
    }
};

export const getCustomerIdByUserId = async (UserId: string | number): Promise<number | false> => {
    if (!checkIsNumber(UserId)) {
        return false;
    }

    try {
        const request = new sql.Request();
        request.input('UserId', sql.Int, UserId);
        
        const result = await request.query<{ Cust_Id: number }>(`
            SELECT cm.Cust_Id
            FROM 
                tbl_Customer_Master AS cm
            INNER JOIN 
                tbl_Users AS u ON cm.User_Mgt_Id = u.UserId
            WHERE 
                cm.User_Mgt_Id = @UserId
        `);

        const custIdGet = result.recordset;

        if (custIdGet.length > 0 && custIdGet[0].Cust_Id) {
            return Number(custIdGet[0].Cust_Id);
        }
        return false;
    } catch (e) {
        console.error('Error in getCustomerIdByUserId:', e);
        return false;
    }
};

export const getUserIdByAuth = async (Auth: string): Promise<number | false> => {
    if (!Auth) {
        return false;
    }

    try {
        const request = new sql.Request();
        request.input('Auth', sql.NVarChar, Auth);
        
        const result = await request.query<{ UserId: number }>(`
            SELECT 
                UserId
            FROM 
                tbl_Users
            WHERE 
                Authenticate_Id = @Auth
        `);

        const getUserId = result.recordset;

        if (getUserId.length > 0) {
            return Number(getUserId[0].UserId);
        }
        return false;
    } catch (e) {
        console.error('Error in getUserIdByAuth:', e);
        return false;
    }
};

export const getUserTypeBasedRights = async (usertype: string | number): Promise<MenuRights[] | false> => {
    if (!userPortalDB) {
        console.error('USERPORTALDB environment variable is not defined');
        return false;
    }

    try {
        const request = new sql.Request();
        request.input('usertype', sql.Int, usertype);
        
        const result = await request.query<MenuRights>(`
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
                tbl_AppMenu_UserTypeRights utr ON utr.UserTypeId = @usertype AND utr.MenuId = m.id
            ORDER BY
                m.parentId, m.displayOrder
        `);

        return result.recordset;
    } catch (e) {
        console.error('Error in getUserTypeBasedRights:', e);
        return false;
    }
};

export const getUserBasedRights = async (userid: string | number): Promise<MenuRights[] | false> => {
    if (!checkIsNumber(userid)) {
        return false;
    }

    if (!userPortalDB) {
        console.error('USERPORTALDB environment variable is not defined');
        return false;
    }

    try {
        const request = new sql.Request();
        request.input('userid', sql.Int, userid);
        
        const result = await request.query<MenuRights>(`
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
                tbl_AppMenu_UserRights ur ON ur.UserId = @userid AND ur.MenuId = m.id
            ORDER BY
                m.parentId, m.displayOrder
        `);

        return result.recordset;
    } catch (e) {
        console.error('Error in getUserBasedRights:', e);
        return false;
    }
};

export const getUserMenuRights = async (Auth: string): Promise<MenuRights[] | false> => {
    if (!userPortalDB) {
        console.error('USERPORTALDB environment variable is not defined');
        return false;
    }

    try {
        const UserTypeId = await getUserTypeByAuth(Auth);

        // for admin and management user have all permissions
        if (isEqualNumber(UserTypeId, 0) || isEqualNumber(UserTypeId, 1)) {
            const request = new sql.Request();
            const result = await request.query<MenuRights>(`
                SELECT 
                    *,
                    1 as Read_Rights,
                    1 as Add_Rights,
                    1 as Edit_Rights,
                    1 as Delete_Rights,
                    1 as Print_Rights
                FROM
                    [${userPortalDB}].[dbo].[tbl_AppMenu]
                ORDER BY
                    parentId, displayOrder
            `);

            return result.recordset;
        } else {
            const UserId = await getUserIdByAuth(Auth);
            
            if (!UserId) {
                return false;
            }

            const request = new sql.Request();
            request.input('userid', sql.Int, UserId);
            request.input('usertype', sql.Int, UserTypeId);
            
            const result = await request.query<MenuRights>(`
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
                    tbl_AppMenu_UserTypeRights utr ON utr.UserTypeId = @usertype AND utr.MenuId = m.id
                ORDER BY
                    m.parentId, m.displayOrder
            `);

            return result.recordset;
        }
    } catch (e) {
        console.error('Error in getUserMenuRights:', e);
        return false;
    }
};

export const getRetailerInfo = async (retailerId: string | number): Promise<MiniResponse> => {
    try {
        if (!checkIsNumber(retailerId)) {
            return miniResponse({
                status: false,
                others: { error: 'Retailer id not received or invalid' }
            });
        }

        const request = new sql.Request();
        request.input('retail', sql.Int, retailerId);
        
        const result = await request.query<RetailerInfo>(`
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
                tbl_Route_Master AS rom ON rom.Route_Id = rm.Route_Id
            LEFT JOIN
                tbl_Area_Master AS am ON am.Area_Id = rm.Area_Id
            LEFT JOIN
                tbl_State_Master AS sm ON sm.State_Id = rm.State_Id
            LEFT JOIN
                tbl_Company_Master AS cm ON cm.Company_id = rm.Company_Id
            LEFT JOIN
                tbl_Users AS modify ON modify.UserId = rm.Updated_By
            LEFT JOIN
                tbl_Users AS created ON created.UserId = rm.Created_By
            WHERE
                rm.Retailer_Id = @retail
        `);

        if (result.recordset.length > 0) {
            return miniResponse({
                status: true,
                dataObject: result.recordset[0]
            });
        }
        
        return miniResponse({
            status: false,
            others: { error: 'Retailer not found' }
        });
    } catch (e) {
        console.error('Error in getRetailerInfo:', e);
        return miniResponse({
            status: false,
            others: { error: e instanceof Error ? e.message : 'Unknown error occurred' }
        });
    }
};

export const getProducts = async (IS_Sold: number = 1): Promise<MiniResponse> => {
    try {
        const request = new sql.Request();
        request.input('IS_Sold', sql.Int, IS_Sold);
        
        const result = await request.query<Product>(`
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
                        TRY_CAST(r.Rate_Date AS DATETIME) DESC
                ), 0) AS Item_Rate,
                TRY_CAST(ISNULL(pck.Pack, 0) AS DECIMAL(18, 2)) AS Pack
            FROM 
                tbl_Product_Master AS p
                LEFT JOIN tbl_Brand_Master AS b ON b.Brand_Id = p.Brand
                LEFT JOIN tbl_Product_Group AS pg ON pg.Pro_Group_Id = p.Product_Group
                LEFT JOIN tbl_UOM AS u ON u.Unit_Id = p.UOM_Id
                LEFT JOIN tbl_Pack_Master AS pck ON pck.Pack_Id = p.Pack_Id
            WHERE
                p.IS_Sold = @IS_Sold
            ORDER BY
                p.Product_Name
        `);

        if (result.recordset.length > 0) {
            return miniResponse({
                status: true,
                dataArray: result.recordset
            });
        }
        
        return miniResponse({
            status: false,
            others: { message: 'No products found' }
        });
    } catch (e) {
        console.error('Error in getProducts:', e);
        return miniResponse({
            status: false,
            others: { error: e instanceof Error ? e.message : 'Unknown error occurred' }
        });
    }
};

export const getNextId = async ({ table, column }: GetNextIdParams): Promise<MiniResponse> => {
    try {
        if (!table || !column) {
            return miniResponse({
                status: false,
                others: { error: 'Invalid Input: table and column are required' }
            });
        }

        // Whitelist approach for table/column names to prevent SQL injection
        const allowedPattern = /^[a-zA-Z0-9_]+$/;
        
        if (!allowedPattern.test(table) || !allowedPattern.test(column)) {
            return miniResponse({
                status: false,
                others: { error: 'Invalid table or column name format' }
            });
        }
        
        const request = new sql.Request();
        const result = await request.query<{ MaxId: number }>(
            `SELECT ISNULL(MAX(${column}), 0) AS MaxId FROM ${table}`
        );

        if (result.recordset.length) {
            return miniResponse({
                status: true,
                others: { MaxId: Number(result.recordset[0].MaxId) + 1 }
            });
        }

        return miniResponse({
            status: false,
            others: { error: 'Failed to get max id' }
        });
    } catch (e) {
        console.error('Error in getNextId:', e);
        return miniResponse({
            status: false,
            others: { error: e instanceof Error ? e.message : 'Unknown error occurred' }
        });
    }
};

export const getLargeData = async (exeQuery: string, db?: sql.ConnectionPool): Promise<any[]> => {
    try {
        const request = db ? new sql.Request(db) : new sql.Request();
        request.stream = true;

        request.query(exeQuery);

        return new Promise<any[]>((resolve, reject) => {
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
        console.error('ERROR in getLargeData: ', e);
        return [];
    }
};

export const getLOL = async (db: sql.ConnectionPool): Promise<MiniResponse> => {
    if (!db) {
        return miniResponse({ 
            status: false, 
            others: { error: 'Database connection pool is missing' } 
        });
    }

    try {
        const result = await getLargeData(
            `SELECT * FROM tbl_LOL_Excel ORDER BY id`, db
        );

        if (result.length > 0) {
            return miniResponse({
                status: true,
                dataArray: result,
            });
        }
        
        return miniResponse({
            status: false,
            others: { message: 'LOL data not found' }
        });
    } catch (e) {
        console.error('Error in getLOL:', e);
        return miniResponse({ 
            status: false, 
            others: { error: 'Failed to fetch LOL data' } 
        });
    }
};

export const getLOS = async (db: sql.ConnectionPool): Promise<MiniResponse> => {
    if (!db) {
        return miniResponse({ 
            status: false, 
            others: { error: 'Database connection pool is missing' } 
        });
    }

    try {
        const result = await getLargeData(
            `SELECT * FROM tbl_LOS_Excel ORDER BY id`, db
        );

        if (result.length > 0) {
            return miniResponse({
                status: true,
                dataArray: result,
            });
        }
        
        return miniResponse({
            status: false,
            others: { message: 'LOS data not found' }
        });
    } catch (e) {
        console.error('Error in getLOS:', e);
        return miniResponse({ 
            status: false, 
            others: { error: 'Failed to fetch LOS data' } 
        });
    }
};