import { Request, Response } from 'express';
import { Op, Sequelize } from 'sequelize';
import {
    created,
    updated,
    deleted,
    servError,
    notFound,
    sentData
} from '../../../responseObject';
import {
    Employee_Master,
    employeeCreateSchema,
    employeeUpdateSchema,
    employeeQuerySchema,
    employeeIdSchema,
    EmployeeCreateInput,
    EmployeeUpdateInput,
    EmployeeQueryParams
} from '../../../models/masters/employee/type.model';
import z, { ZodError } from 'zod';
import { sequelize } from '../../../config/sequalizer';

// Helper function to clean mobile number
const cleanMobileNumber = (mobileNo: string | null | undefined): string | null => {
    if (!mobileNo || mobileNo.trim() === '') {
        return null;
    }
    
    // Remove all non-digit characters
    let cleaned = mobileNo.replace(/\D/g, '');
    
    // Remove leading zeros
    cleaned = cleaned.replace(/^0+/, '');
    
    // Check if it's a valid Indian mobile number
    if (/^[6789]\d{9}$/.test(cleaned)) {
        return cleaned; // Return as 10-digit number
    }
    
    // Check if it's 12 digits (91 + 10 digits)
    if (/^91[6789]\d{9}$/.test(cleaned)) {
        return cleaned.substring(2); // Remove country code
    }
    
    // If it starts with +91 and then 10 digits
    if (/^\+91[6789]\d{9}$/.test(mobileNo.replace(/\s/g, ''))) {
        return mobileNo.replace(/\D/g, '').substring(2); // Remove +91
    }
    
    // Return null for invalid numbers
    return null;
};

// Extend the EmployeeQueryParams type to include pagination
export const employeeQuerySchemaExtended = employeeQuerySchema.extend({
    page: z.coerce.number()
        .int()
        .positive('Page must be positive')
        .min(1, 'Page must be at least 1')
        .default(1)
        .optional(),
    limit: z.coerce.number()
        .int()
        .positive('Limit must be positive')
        .min(1, 'Limit must be at least 1')
        .max(100, 'Limit cannot exceed 100')
        .default(50)
        .optional()
});

export type ExtendedEmployeeQueryParams = z.infer<typeof employeeQuerySchemaExtended>;

// Helper function for Zod validation
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
            const zodIssues = error.issues || (error as any).errors || [];

            return {
                success: false,
                errors: zodIssues.map((err: any) => ({
                    field: Array.isArray(err.path) ? err.path.join('.') : String(err.path || 'unknown'),
                    message: err.message || 'Validation error'
                }))
            };
        }
        return {
            success: false,
            errors: [{ field: 'unknown', message: 'Validation failed' }]
        };
    }
};

// Helper function to prepare employee data
const prepareEmployeeData = (data: any) => {
    const preparedData = { ...data };

    // Convert date strings to Date objects
    if (preparedData.DOB && typeof preparedData.DOB === 'string') {
        const dobDate = new Date(preparedData.DOB);
        if (!isNaN(dobDate.getTime())) {
            preparedData.DOB = dobDate;
        } else {
            preparedData.DOB = null;
        }
    }

    if (preparedData.DOJ && typeof preparedData.DOJ === 'string') {
        const dojDate = new Date(preparedData.DOJ);
        if (!isNaN(dojDate.getTime())) {
            preparedData.DOJ = dojDate;
        } else {
            preparedData.DOJ = null;
        }
    }

    if (preparedData.Entry_Date && typeof preparedData.Entry_Date === 'string') {
        const entryDate = new Date(preparedData.Entry_Date);
        if (!isNaN(entryDate.getTime())) {
            preparedData.Entry_Date = entryDate;
        } else {
            preparedData.Entry_Date = null;
        }
    }

    // Clean mobile number
    if (preparedData.Mobile_No) {
        const cleanedMobile = cleanMobileNumber(preparedData.Mobile_No);
        if (cleanedMobile) {
            preparedData.Mobile_No = cleanedMobile;
        } else {
            preparedData.Mobile_No = null;
        }
    }

    // Ensure loan values are properly set
    if (preparedData.Total_Loan !== undefined) {
        preparedData.Total_Loan = preparedData.Total_Loan || 0;
    }
    
    if (preparedData.Salary_Advance !== undefined) {
        preparedData.Salary_Advance = preparedData.Salary_Advance || 0;
    }
    
    if (preparedData.Due_Loan !== undefined) {
        preparedData.Due_Loan = preparedData.Due_Loan || 0;
    }

    return preparedData;
};

// GET all employees with filtering and pagination
export const getAllEmployees = async (req: Request, res: Response) => {
    try {
        const queryData = { ...req.query };

        const validation = validateWithZod<ExtendedEmployeeQueryParams>(
            employeeQuerySchemaExtended,
            queryData
        );

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid query parameters',
                errors: validation.errors
            });
        }

        const queryParams = validation.data!;
        const where: any = {};

        // Apply filters
        if (queryParams.branch) {
            where.Branch = queryParams.branch;
        }

        if (queryParams.departmentId) {
            where.Department_ID = queryParams.departmentId;
        }

        if (queryParams.designation) {
            where.Designation = queryParams.designation;
        }

        if (queryParams.search) {
            const searchTerm = `%${queryParams.search}%`;
            where[Op.or] = [
                { Emp_Code: { [Op.like]: searchTerm } },
                { Emp_Name: { [Op.like]: searchTerm } },
                { Mobile_No: { [Op.like]: searchTerm } }
            ];
        }

        // Set pagination
        const page = queryParams.page || 1;
        const limit = queryParams.limit || 50;
        const offset = (page - 1) * limit;

        // Fetch employees with sorting
        const { rows, count } = await Employee_Master.findAndCountAll({
            where,
            order: [[queryParams.sortBy, queryParams.sortOrder]],
            limit: limit,
            offset: offset
        });

        // Prepare response
        const response = {
            success: true,
            message: 'Employees fetched successfully',
            data: rows,
            pagination: {
                total: count,
                page: page,
                limit: limit,
                totalPages: Math.ceil(count / limit)
            }
        };

        return res.status(200).json(response);

    } catch (err) {
        console.error('Error fetching employees:', err);
        return servError(err, res);
    }
};

// GET employee by ID
export const getEmployeeById = async (req: Request, res: Response) => {
    try {
        const validation = validateWithZod<{ id: number }>(
            employeeIdSchema,
            req.params
        );

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID parameter',
                errors: validation.errors
            });
        }

        const { id } = validation.data!;

        const employee = await Employee_Master.findOne({
            where: {
                Emp_Id: id
            }
        });

        if (!employee) {
            return notFound(res, 'Employee not found');
        }

        return res.status(200).json({
            success: true,
            message: 'Employee fetched successfully',
            data: employee
        });

    } catch (e) {
        console.error('Error fetching employee by ID:', e);
        return servError(e, res);
    }
};

// GET employee by Employee Code
export const getEmployeeByCode = async (req: Request, res: Response) => {
    try {
        const { empCode } = req.params;

        if (!empCode || empCode.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Employee Code is required'
            });
        }

        const employee = await Employee_Master.findOne({
            where: {
                Emp_Code: empCode.trim()
            }
        });

        if (!employee) {
            return notFound(res, 'Employee not found');
        }

        return res.status(200).json({
            success: true,
            message: 'Employee fetched successfully',
            data: employee
        });

    } catch (e) {
        console.error('Error fetching employee by code:', e);
        return servError(e, res);
    }
};

// POST create new employee
export const createEmployee = async (req: Request, res: Response) => {
    try {
        // Check for duplicate employee code if provided
        if (req.body.Emp_Code) {
            const existing = await Employee_Master.findOne({
                where: {
                    Emp_Code: req.body.Emp_Code.trim()
                }
            });

            if (existing) {
                return res.status(409).json({
                    success: false,
                    message: 'Employee with this code already exists',
                    field: 'Emp_Code'
                });
            }
        }

        // Prepare data
        const preparedData = prepareEmployeeData(req.body);

        // Set Entry_Date to current date if not provided
        if (!preparedData.Entry_Date) {
            preparedData.Entry_Date = new Date();
        }

        // Validate input
        const validation = validateWithZod<EmployeeCreateInput>(
            employeeCreateSchema,
            preparedData
        );

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        // Create employee
        const employee = await Employee_Master.create(validation.data!);

        return created(res, employee, 'Employee created successfully');

    } catch (error) {
        console.error('Error creating employee:', error);
        return servError(error, res);
    }
};

// PUT update employee
export const updateEmployee = async (req: Request, res: Response) => {
    try {
        // Validate ID
        const idValidation = validateWithZod<{ id: number }>(employeeIdSchema, req.params);
        if (!idValidation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID parameter',
                errors: idValidation.errors
            });
        }

        const { id } = idValidation.data!;

        // Check if employee exists
        const employee = await Employee_Master.findByPk(id);
        if (!employee) {
            return notFound(res, 'Employee not found');
        }

        // Check for duplicate employee code if being changed
        if (req.body.Emp_Code && req.body.Emp_Code !== employee.Emp_Code) {
            const duplicateEmployee = await Employee_Master.findOne({
                where: {
                    Emp_Code: req.body.Emp_Code.trim(),
                    Emp_Id: { [Op.ne]: id }
                }
            });

            if (duplicateEmployee) {
                return res.status(409).json({
                    success: false,
                    message: 'Another employee with this code already exists',
                    field: 'Emp_Code'
                });
            }
        }

        // Prepare update data
        const updateData = prepareEmployeeData(req.body);

        // Validate update input
        const validation = validateWithZod<EmployeeUpdateInput>(employeeUpdateSchema, updateData);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        // Update employee
        await employee.update(validation.data!);

        return updated(res, employee, 'Employee updated successfully');

    } catch (e) {
        console.error('Error updating employee:', e);
        return servError(e, res);
    }
};

// DELETE employee (hard delete)
export const deleteEmployee = async (req: Request, res: Response) => {
    try {
        const validation = validateWithZod<{ id: number }>(employeeIdSchema, req.params);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID parameter',
                errors: validation.errors
            });
        }

        const { id } = validation.data!;

        const employee = await Employee_Master.findByPk(id);

        if (!employee) {
            return notFound(res, 'Employee not found');
        }

        await employee.destroy();

        return deleted(res, 'Employee deleted successfully');

    } catch (e) {
        console.error('Error deleting employee:', e);
        return servError(e, res);
    }
};

// GET employees by branch
export const getEmployeesByBranch = async (req: Request, res: Response) => {
    try {
        const { branchId } = req.params;

        const branchIdNum = Number(branchId);
        if (!branchId || isNaN(branchIdNum) || branchIdNum <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid Branch ID is required'
            });
        }

        const employees = await Employee_Master.findAll({
            where: {
                Branch: branchIdNum
            },
            order: [['Emp_Name', 'ASC']]
        });

        return sentData(res, employees);

    } catch (e) {
        console.error('Error fetching employees by branch:', e);
        return servError(e, res);
    }
};

// GET employees by department
export const getEmployeesByDepartment = async (req: Request, res: Response) => {
    try {
        const { departmentId } = req.params;

        const departmentIdNum = Number(departmentId);
        if (!departmentId || isNaN(departmentIdNum) || departmentIdNum <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid Department ID is required'
            });
        }

        const employees = await Employee_Master.findAll({
            where: {
                Department_ID: departmentIdNum
            },
            order: [['Emp_Name', 'ASC']]
        });

        return sentData(res, employees);

    } catch (e) {
        console.error('Error fetching employees by department:', e);
        return servError(e, res);
    }
};

// GET active employees
export const getActiveEmployees = async (req: Request, res: Response) => {
    try {
        const employees = await Employee_Master.findAll({
            order: [['Emp_Name', 'ASC']],
            limit: 1000 // Add limit to prevent overwhelming responses
        });

        return sentData(res, employees);

    } catch (e) {
        console.error('Error fetching active employees:', e);
        return servError(e, res);
    }
};

// Define types for bulk operations
interface BulkError {
    empCode: string;
    message: string;
    errors?: Array<{ field: string; message: string }>;
}

interface BulkResult {
    empCode: string;
    success: boolean;
    employeeId?: number;
    message: string;
}

// POST bulk create employees
export const bulkCreateEmployees = async (req: Request, res: Response) => {
    try {
        const employeesData = req.body;

        if (!Array.isArray(employeesData)) {
            return res.status(400).json({
                success: false,
                message: 'Request body must be an array of employee data'
            });
        }

        const results: BulkResult[] = [];
        const errors: BulkError[] = [];

        for (const empData of employeesData) {
            const empCode = empData.Emp_Code || 'N/A';
            
            try {
                // Check for duplicate employee code
                if (empData.Emp_Code) {
                    const existing = await Employee_Master.findOne({
                        where: { Emp_Code: empData.Emp_Code.trim() }
                    });

                    if (existing) {
                        errors.push({
                            empCode,
                            message: 'Employee code already exists'
                        });
                        continue;
                    }
                }

                // Prepare data
                const preparedData = prepareEmployeeData(empData);
                if (!preparedData.Entry_Date) {
                    preparedData.Entry_Date = new Date();
                }

                // Validate
                const validation = validateWithZod<EmployeeCreateInput>(
                    employeeCreateSchema,
                    preparedData
                );

                if (!validation.success) {
                    errors.push({
                        empCode,
                        errors: validation.errors,
                        message: 'Validation failed'
                    });
                    continue;
                }

                // Create employee
                const employee = await Employee_Master.create(validation.data!);
                results.push({
                    empCode,
                    success: true,
                    employeeId: employee.Emp_Id,
                    message: 'Employee created successfully'
                });

            } catch (error) {
                errors.push({
                    empCode,
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        return res.status(201).json({
            success: true,
            message: 'Bulk employee creation completed',
            created: results.length,
            failed: errors.length,
            results: results,
            errors: errors
        });

    } catch (error) {
        console.error('Error in bulk employee creation:', error);
        return servError(error, res);
    }
};

// GET employee statistics
export const getEmployeeStatistics = async (req: Request, res: Response) => {
    try {
        // Example statistics - customize based on your needs
        const totalEmployees = await Employee_Master.count();
        
        // Count by gender
        const genderStats = await Employee_Master.findAll({
            attributes: [
                'Sex',
                [Sequelize.fn('COUNT', Sequelize.col('Emp_Id')), 'count']
            ],
            group: ['Sex']
        });

        // Count by department
        const departmentStats = await Employee_Master.findAll({
            attributes: [
                'Department_ID',
                'Department',
                [Sequelize.fn('COUNT', Sequelize.col('Emp_Id')), 'count']
            ],
            group: ['Department_ID', 'Department']
        });

        // Salary statistics
        const salaryStats = await Employee_Master.findOne({
            attributes: [
                [Sequelize.fn('AVG', Sequelize.col('Salary')), 'averageSalary'],
                [Sequelize.fn('MAX', Sequelize.col('Salary')), 'maxSalary'],
                [Sequelize.fn('MIN', Sequelize.col('Salary')), 'minSalary'],
                [Sequelize.fn('SUM', Sequelize.col('Salary')), 'totalSalary']
            ]
        });

        const statistics = {
            totalEmployees,
            genderDistribution: genderStats,
            departmentDistribution: departmentStats,
            salaryStatistics: salaryStats
        };

        return res.status(200).json({
            success: true,
            message: 'Employee statistics fetched successfully',
            data: statistics
        });

    } catch (e) {
        console.error('Error fetching employee statistics:', e);
        return servError(e, res);
    }
};

// PATCH partial update employee
export const partialUpdateEmployee = async (req: Request, res: Response) => {
    try {
        // Validate ID
        const idValidation = validateWithZod<{ id: number }>(employeeIdSchema, req.params);
        if (!idValidation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID parameter',
                errors: idValidation.errors
            });
        }

        const { id } = idValidation.data!;

        // Check if employee exists
        const employee = await Employee_Master.findByPk(id);
        if (!employee) {
            return notFound(res, 'Employee not found');
        }

        // Check for duplicate employee code if being changed
        if (req.body.Emp_Code && req.body.Emp_Code !== employee.Emp_Code) {
            const duplicateEmployee = await Employee_Master.findOne({
                where: {
                    Emp_Code: req.body.Emp_Code.trim(),
                    Emp_Id: { [Op.ne]: id }
                }
            });

            if (duplicateEmployee) {
                return res.status(409).json({
                    success: false,
                    message: 'Another employee with this code already exists',
                    field: 'Emp_Code'
                });
            }
        }

        // Prepare update data
        const updateData = prepareEmployeeData(req.body);

        // Validate update input (use update schema for partial updates)
        const validation = validateWithZod<EmployeeUpdateInput>(employeeUpdateSchema, updateData);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        // Update only provided fields
        await employee.update(validation.data!);

        return res.status(200).json({
            success: true,
            message: 'Employee partially updated successfully',
            data: employee
        });

    } catch (e) {
        console.error('Error partially updating employee:', e);
        return servError(e, res);
    }
};

// SEARCH employees with advanced filtering
export const searchEmployees = async (req: Request, res: Response) => {
    try {
        const { 
            name, 
            department, 
            designation, 
            branch, 
            city, 
            fromDate, 
            toDate,
            minSalary,
            maxSalary
        } = req.query;

        const where: any = {};

        if (name) {
            where.Emp_Name = { [Op.like]: `%${name}%` };
        }

        if (department) {
            where.Department_ID = Number(department);
        }

        if (designation) {
            where.Designation = Number(designation);
        }

        if (branch) {
            where.Branch = Number(branch);
        }

        if (city) {
            where.City = { [Op.like]: `%${city}%` };
        }

        if (fromDate && toDate) {
            where.DOJ = {
                [Op.between]: [new Date(fromDate as string), new Date(toDate as string)]
            };
        } else if (fromDate) {
            where.DOJ = { [Op.gte]: new Date(fromDate as string) };
        } else if (toDate) {
            where.DOJ = { [Op.lte]: new Date(toDate as string) };
        }

        if (minSalary) {
            where.Salary = { ...where.Salary, [Op.gte]: Number(minSalary) };
        }

        if (maxSalary) {
            where.Salary = { ...where.Salary, [Op.lte]: Number(maxSalary) };
        }

        const employees = await Employee_Master.findAll({
            where,
            order: [['Emp_Name', 'ASC']],
            limit: 1000
        });

        return res.status(200).json({
            success: true,
            message: 'Employees search completed',
            data: employees,
            count: employees.length
        });

    } catch (e) {
        console.error('Error searching employees:', e);
        return servError(e, res);
    }
};

// GET employee count by criteria
export const getEmployeeCount = async (req: Request, res: Response) => {
    try {
        const { branch, departmentId, designation } = req.query;

        const where: any = {};

        if (branch) {
            const branchNum = Number(branch);
            if (!isNaN(branchNum) && branchNum > 0) {
                where.Branch = branchNum;
            }
        }

        if (departmentId) {
            const deptNum = Number(departmentId);
            if (!isNaN(deptNum) && deptNum > 0) {
                where.Department_ID = deptNum;
            }
        }

        if (designation) {
            const desigNum = Number(designation);
            if (!isNaN(desigNum) && desigNum > 0) {
                where.Designation = desigNum;
            }
        }

        const count = await Employee_Master.count({
            where
        });

        return res.status(200).json({
            success: true,
            message: 'Employee count fetched successfully',
            data: { count }
        });

    } catch (e) {
        console.error('Error fetching employee count:', e);
        return servError(e, res);
    }
};

// GET employees with salary range
export const getEmployeesBySalaryRange = async (req: Request, res: Response) => {
    try {
        const { minSalary, maxSalary } = req.query;

        if (!minSalary && !maxSalary) {
            return res.status(400).json({
                success: false,
                message: 'Please provide at least one salary parameter (minSalary or maxSalary)'
            });
        }

        const where: any = {};

        if (minSalary) {
            const minSalaryNum = Number(minSalary);
            if (!isNaN(minSalaryNum) && minSalaryNum >= 0) {
                where.Salary = { ...where.Salary, [Op.gte]: minSalaryNum };
            }
        }

        if (maxSalary) {
            const maxSalaryNum = Number(maxSalary);
            if (!isNaN(maxSalaryNum) && maxSalaryNum >= 0) {
                where.Salary = { ...where.Salary, [Op.lte]: maxSalaryNum };
            }
        }

        const employees = await Employee_Master.findAll({
            where,
            order: [['Salary', 'DESC'], ['Emp_Name', 'ASC']],
            limit: 1000
        });

        return res.status(200).json({
            success: true,
            message: 'Employees fetched by salary range',
            data: employees,
            count: employees.length
        });

    } catch (e) {
        console.error('Error fetching employees by salary range:', e);
        return servError(e, res);
    }
};

// Validate mobile number format
export const validateMobileNumber = (mobileNo: string): boolean => {
    if (!mobileNo) return false;
    
    // Remove all non-digit characters
    const cleaned = mobileNo.replace(/\D/g, '');
    
    // Check if it's a valid 10-digit Indian mobile number
    return /^[6789]\d{9}$/.test(cleaned);
};