import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../config/sequalizer';
import { z } from 'zod';

const modelName = 'Company_Master';

export interface CompanyAttributes {
    Company_id: number;
    Company_Code: string;
    Company_Name: string;
    Company_Address?: string | null;
    State?: string | null;
    Region?: string | null;
    Pincode?: string | null;
    Country?: string | null;
    VAT_TIN_Number?: string | null;
    PAN_Number?: string | null;
    CST_Number?: string | null;
    CIN_Number?: string | null;
    Service_Tax_Number?: string | null;
    MSME_Number?: string | null;
    NSIC_Number?: string | null;
    Account_Number?: string | null;
    IFC_Code?: string | null;
    Bank_Branch_Name?: string | null;
    Bank_Name?: string | null;
    Telephone_Number?: string | null;
    Support_Number?: string | null;
    Mail?: string | null;
    Website?: string | null;
    Gst_Number?: string | null;
    State_Code?: string | null;
    State_No?: string | null;
    Entry_By?: number | null;
    Entry_Date?: Date | null;
    Modified_By?: number | null;
    Modified_Date?: Date | null;
    Del_Flag?: number | null;
    Deleted_By?: number | null;
    Deleted_Date?: Date | null;
}

type CompanyCreationAttributes = Optional<CompanyAttributes, 'Company_id'>;

export class Company_Master 
    extends Model<CompanyAttributes, CompanyCreationAttributes> 
    implements CompanyAttributes {
    
    declare Company_id: number;
    declare Company_Code: string;
    declare Company_Name: string;
    declare Company_Address: string | null;
    declare State: string | null;
    declare Region: string | null;
    declare Pincode: string | null;
    declare Country: string | null;
    declare VAT_TIN_Number: string | null;
    declare PAN_Number: string | null;
    declare CST_Number: string | null;
    declare CIN_Number: string | null;
    declare Service_Tax_Number: string | null;
    declare MSME_Number: string | null;
    declare NSIC_Number: string | null;
    declare Account_Number: string | null;
    declare IFC_Code: string | null;
    declare Bank_Branch_Name: string | null;
    declare Bank_Name: string | null;
    declare Telephone_Number: string | null;
    declare Support_Number: string | null;
    declare Mail: string | null;
    declare Website: string | null;
    declare Gst_Number: string | null;
    declare State_Code: string | null;
    declare State_No: string | null;
    declare Entry_By: number | null;
    declare Entry_Date: Date | null;
    declare Modified_By: number | null;
    declare Modified_Date: Date | null;
    declare Del_Flag: number | null;
    declare Deleted_By: number | null;
    declare Deleted_Date: Date | null;
}

// Zod schemas
export const companyCreateSchema = z.object({
    Company_Code: z.string()
        .min(1, 'Company Code is required')
        .max(50, 'Company Code cannot exceed 50 characters')
        .trim(),
    Company_Name: z.string()
        .min(1, 'Company Name is required')
        .max(250, 'Company Name cannot exceed 250 characters')
        .trim(),
    Company_Address: z.string()
        .max(500, 'Company Address cannot exceed 500 characters')
        .nullable()
        .optional()
        .default(null),
    State: z.string()
        .max(100, 'State cannot exceed 100 characters')
        .nullable()
        .optional()
        .default(null),
    Region: z.string()
        .max(100, 'Region cannot exceed 100 characters')
        .nullable()
        .optional()
        .default(null),
    Pincode: z.string()
        .max(20, 'Pincode cannot exceed 20 characters')
        .nullable()
        .optional()
        .default(null),
    Country: z.string()
        .max(100, 'Country cannot exceed 100 characters')
        .nullable()
        .optional()
        .default(null),
    VAT_TIN_Number: z.string()
        .max(50, 'VAT/TIN Number cannot exceed 50 characters')
        .nullable()
        .optional()
        .default(null),
    PAN_Number: z.string()
        .max(50, 'PAN Number cannot exceed 50 characters')
        .nullable()
        .optional()
        .default(null),
    CST_Number: z.string()
        .max(50, 'CST Number cannot exceed 50 characters')
        .nullable()
        .optional()
        .default(null),
    CIN_Number: z.string()
        .max(50, 'CIN Number cannot exceed 50 characters')
        .nullable()
        .optional()
        .default(null),
    Service_Tax_Number: z.string()
        .max(50, 'Service Tax Number cannot exceed 50 characters')
        .nullable()
        .optional()
        .default(null),
    MSME_Number: z.string()
        .max(50, 'MSME Number cannot exceed 50 characters')
        .nullable()
        .optional()
        .default(null),
    NSIC_Number: z.string()
        .max(50, 'NSIC Number cannot exceed 50 characters')
        .nullable()
        .optional()
        .default(null),
    Account_Number: z.string()
        .max(50, 'Account Number cannot exceed 50 characters')
        .nullable()
        .optional()
        .default(null),
    IFC_Code: z.string()
        .max(20, 'IFC Code cannot exceed 20 characters')
        .nullable()
        .optional()
        .default(null),
    Bank_Branch_Name: z.string()
        .max(200, 'Bank Branch Name cannot exceed 200 characters')
        .nullable()
        .optional()
        .default(null),
    Bank_Name: z.string()
        .max(200, 'Bank Name cannot exceed 200 characters')
        .nullable()
        .optional()
        .default(null),
    Telephone_Number: z.string()
        .max(20, 'Telephone Number cannot exceed 20 characters')
        .nullable()
        .optional()
        .default(null),
    Support_Number: z.string()
        .max(20, 'Support Number cannot exceed 20 characters')
        .nullable()
        .optional()
        .default(null),
    Mail: z.string()
        .email('Invalid email format')
        .max(100, 'Email cannot exceed 100 characters')
        .nullable()
        .optional()
        .default(null),
    Website: z.string()
        .max(100, 'Website cannot exceed 100 characters')
        .nullable()
        .optional()
        .default(null),
    Gst_Number: z.string()
        .max(50, 'GST Number cannot exceed 50 characters')
        .nullable()
        .optional()
        .default(null),
    State_Code: z.string()
        .max(10, 'State Code cannot exceed 10 characters')
        .nullable()
        .optional()
        .default(null),
    State_No: z.string()
        .max(10, 'State No cannot exceed 10 characters')
        .nullable()
        .optional()
        .default(null)
});

export const companyUpdateSchema = z.object({
    Company_Code: z.string()
        .max(50, 'Company Code cannot exceed 50 characters')
        .trim()
        .optional(),
    Company_Name: z.string()
        .max(250, 'Company Name cannot exceed 250 characters')
        .trim()
        .optional(),
    Company_Address: z.string()
        .max(500, 'Company Address cannot exceed 500 characters')
        .nullable()
        .optional(),
    State: z.string()
        .max(100, 'State cannot exceed 100 characters')
        .nullable()
        .optional(),
    Region: z.string()
        .max(100, 'Region cannot exceed 100 characters')
        .nullable()
        .optional(),
    Pincode: z.string()
        .max(20, 'Pincode cannot exceed 20 characters')
        .nullable()
        .optional(),
    Country: z.string()
        .max(100, 'Country cannot exceed 100 characters')
        .nullable()
        .optional(),
    VAT_TIN_Number: z.string()
        .max(50, 'VAT/TIN Number cannot exceed 50 characters')
        .nullable()
        .optional(),
    PAN_Number: z.string()
        .max(50, 'PAN Number cannot exceed 50 characters')
        .nullable()
        .optional(),
    CST_Number: z.string()
        .max(50, 'CST Number cannot exceed 50 characters')
        .nullable()
        .optional(),
    CIN_Number: z.string()
        .max(50, 'CIN Number cannot exceed 50 characters')
        .nullable()
        .optional(),
    Service_Tax_Number: z.string()
        .max(50, 'Service Tax Number cannot exceed 50 characters')
        .nullable()
        .optional(),
    MSME_Number: z.string()
        .max(50, 'MSME Number cannot exceed 50 characters')
        .nullable()
        .optional(),
    NSIC_Number: z.string()
        .max(50, 'NSIC Number cannot exceed 50 characters')
        .nullable()
        .optional(),
    Account_Number: z.string()
        .max(50, 'Account Number cannot exceed 50 characters')
        .nullable()
        .optional(),
    IFC_Code: z.string()
        .max(20, 'IFC Code cannot exceed 20 characters')
        .nullable()
        .optional(),
    Bank_Branch_Name: z.string()
        .max(200, 'Bank Branch Name cannot exceed 200 characters')
        .nullable()
        .optional(),
    Bank_Name: z.string()
        .max(200, 'Bank Name cannot exceed 200 characters')
        .nullable()
        .optional(),
    Telephone_Number: z.string()
        .max(20, 'Telephone Number cannot exceed 20 characters')
        .nullable()
        .optional(),
    Support_Number: z.string()
        .max(20, 'Support Number cannot exceed 20 characters')
        .nullable()
        .optional(),
    Mail: z.string()
        .email('Invalid email format')
        .max(100, 'Email cannot exceed 100 characters')
        .nullable()
        .optional(),
    Website: z.string()
        .max(100, 'Website cannot exceed 100 characters')
        .nullable()
        .optional(),
    Gst_Number: z.string()
        .max(50, 'GST Number cannot exceed 50 characters')
        .nullable()
        .optional(),
    State_Code: z.string()
        .max(10, 'State Code cannot exceed 10 characters')
        .nullable()
        .optional(),
    State_No: z.string()
        .max(10, 'State No cannot exceed 10 characters')
        .nullable()
        .optional(),
    Del_Flag: z.coerce.number()
        .int()
        .min(0, 'Del_Flag must be 0 or 1')
        .max(1, 'Del_Flag must be 0 or 1')
        .optional()
});

export const companyQuerySchema = z.object({
    page: z.coerce.number()
        .int()
        .positive('Page must be positive')
        .default(1),
    limit: z.coerce.number()
        .int()
        .min(1, 'Limit must be at least 1')
        .max(100, 'Limit cannot exceed 100')
        .default(20),
    search: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    active: z.enum(['true', 'false', 'all'])
        .default('true'),
    sortBy: z.enum([
        'Company_id',
        'Company_Code', 
        'Company_Name', 
        'State', 
        'Country', 
        'Entry_Date'
    ])
        .default('Company_id'),
    sortOrder: z.enum(['ASC', 'DESC'])
        .default('ASC')
});

export const companyIdSchema = z.object({
    id: z.coerce.number()
        .int()
        .positive('Valid ID is required')
});

export type CompanyCreateInput = z.infer<typeof companyCreateSchema>;
export type CompanyUpdateInput = z.infer<typeof companyUpdateSchema>;
export type CompanyQueryParams = z.infer<typeof companyQuerySchema>;

// Initialize the model
Company_Master.init(
    {
        Company_id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            field: 'Company_id'
        },
        Company_Code: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: 'Company_Code',
            validate: {
                notEmpty: {
                    msg: 'Company Code is required'
                }
            }
        },
        Company_Name: {
            type: DataTypes.STRING(250),
            allowNull: false,
            field: 'Company_Name',
            validate: {
                notEmpty: {
                    msg: 'Company Name is required'
                }
            }
        },
        Company_Address: {
            type: DataTypes.STRING(500),
            allowNull: true,
            field: 'Company_Address'
        },
        State: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: 'State'
        },
        Region: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: 'Region'
        },
        Pincode: {
            type: DataTypes.STRING(20),
            allowNull: true,
            field: 'Pincode'
        },
        Country: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: 'Country'
        },
        VAT_TIN_Number: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'VAT_TIN_Number'
        },
        PAN_Number: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'PAN_Number'
        },
        CST_Number: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'CST_Number'
        },
        CIN_Number: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'CIN_Number'
        },
        Service_Tax_Number: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'Service_Tax_Number'
        },
        MSME_Number: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'MSME_Number'
        },
        NSIC_Number: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'NSIC_Number'
        },
        Account_Number: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'Account_Number'
        },
        IFC_Code: {
            type: DataTypes.STRING(20),
            allowNull: true,
            field: 'IFC_Code'
        },
        Bank_Branch_Name: {
            type: DataTypes.STRING(200),
            allowNull: true,
            field: 'Bank_Branch_Name'
        },
        Bank_Name: {
            type: DataTypes.STRING(200),
            allowNull: true,
            field: 'Bank_Name'
        },
        Telephone_Number: {
            type: DataTypes.STRING(20),
            allowNull: true,
            field: 'Telephone_Number'
        },
        Support_Number: {
            type: DataTypes.STRING(20),
            allowNull: true,
            field: 'Support_Number'
        },
        Mail: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: 'Mail',
            validate: {
                isEmail: {
                    msg: 'Invalid email format'
                }
            }
        },
        Website: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: 'Website'
        },
        Gst_Number: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'Gst_Number'
        },
        State_Code: {
            type: DataTypes.STRING(10),
            allowNull: true,
            field: 'State_Code'
        },
        State_No: {
            type: DataTypes.STRING(10),
            allowNull: true,
            field: 'State_No'
        },
        Entry_By: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'Entry_By'
        },
        Entry_Date: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'Entry_Date'
        },
        Modified_By: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'Modified_By'
        },
        Modified_Date: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'Modified_Date'
        },
        Del_Flag: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
            field: 'Del_Flag',
            validate: {
                min: 0,
                max: 1,
                isIn: {
                    args: [[0, 1]],
                    msg: 'Del_Flag must be 0 or 1'
                }
            }
        },
        Deleted_By: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'Deleted_By'
        },
        Deleted_Date: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'Deleted_Date'
        }
    },
    {
        sequelize,
        tableName: 'tbl_Company_Master',
        modelName: modelName,
        timestamps: false,
        freezeTableName: true,
        defaultScope: {
            where: {
                Del_Flag: 0
            }
        },
        scopes: {
            active: {
                where: {
                    Del_Flag: 0
                }
            },
            deleted: {
                where: {
                    Del_Flag: 1
                }
            },
            byState: (state: string) => ({
                where: {
                    State: state,
                    Del_Flag: 0
                }
            }),
            byCountry: (country: string) => ({
                where: {
                    Country: country,
                    Del_Flag: 0
                }
            })
        }
    }
);

export const companyAccKey = {
    id: `${modelName}.Company_id`,
    Company_Code: `${modelName}.Company_Code`,
    Company_Name: `${modelName}.Company_Name`,
    Company_Address: `${modelName}.Company_Address`,
    State: `${modelName}.State`,
    Region: `${modelName}.Region`,
    Pincode: `${modelName}.Pincode`,
    Country: `${modelName}.Country`,
    VAT_TIN_Number: `${modelName}.VAT_TIN_Number`,
    PAN_Number: `${modelName}.PAN_Number`,
    CST_Number: `${modelName}.CST_Number`,
    CIN_Number: `${modelName}.CIN_Number`,
    Service_Tax_Number: `${modelName}.Service_Tax_Number`,
    MSME_Number: `${modelName}.MSME_Number`,
    NSIC_Number: `${modelName}.NSIC_Number`,
    Account_Number: `${modelName}.Account_Number`,
    IFC_Code: `${modelName}.IFC_Code`,
    Bank_Branch_Name: `${modelName}.Bank_Branch_Name`,
    Bank_Name: `${modelName}.Bank_Name`,
    Telephone_Number: `${modelName}.Telephone_Number`,
    Support_Number: `${modelName}.Support_Number`,
    Mail: `${modelName}.Mail`,
    Website: `${modelName}.Website`,
    Gst_Number: `${modelName}.Gst_Number`,
    State_Code: `${modelName}.State_Code`,
    State_No: `${modelName}.State_No`,
    Entry_By: `${modelName}.Entry_By`,
    Entry_Date: `${modelName}.Entry_Date`,
    Modified_By: `${modelName}.Modified_By`,
    Modified_Date: `${modelName}.Modified_Date`,
    Del_Flag: `${modelName}.Del_Flag`,
    Deleted_By: `${modelName}.Deleted_By`,
    Deleted_Date: `${modelName}.Deleted_Date`
};

export default Company_Master;