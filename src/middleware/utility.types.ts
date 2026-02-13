export interface MiniResponseParams {
    status?: boolean;
    dataArray?: any[];
    dataObject?: Record<string, any>;
    others?: Record<string, any>;
}

export interface MiniResponse {
    status: boolean;
    dataArray: any[];
    dataObject: Record<string, any>;
    [key: string]: any;
}

export interface GetNextIdParams {
    table: string;
    column: string;
}

export interface NextIdResponse {
    MaxId?: number;
    error?: any;
    message?: string;
    Err?: string;
}

export interface RetailerInfo {
    Retailer_Id: number;
    Retailer_Name: string;
    RouteGet?: string;
    AreaGet?: string;
    StateGet?: string;
    Company_Name?: string;
    lastModifiedBy?: string;
    createdBy?: string;
    VERIFIED_LOCATION?: any;
    [key: string]: any;
}

export interface Product {
    Product_Id: number;
    Product_Name: string;
    Brand_Name: string;
    Pro_Group: string;
    Units: string;
    Item_Rate: number;
    Pack: number;
    IS_Sold?: number;
    [key: string]: any;
}

export interface UserTypeResult {
    Id: number;
}

export interface UserIdResult {
    UserId: number;
}

export interface CustIdResult {
    Cust_Id: number;
}

export interface MenuRights {
    id: number;
    menuName: string;
    parentId: number;
    Read_Rights: number;
    Add_Rights: number;
    Edit_Rights: number;
    Delete_Rights: number;
    Print_Rights: number;
    [key: string]: any;
}