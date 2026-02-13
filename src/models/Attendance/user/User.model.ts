import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../config/sequalizer'; // Fixed typo: sequalizer → sequelize
import { z } from 'zod';

const modelName = 'User';

export interface UserAttributes {
    UserId: number;
    Name: string;
    Email?: string | null;
    Mobile_No?: string | null;
    Authenticate_Id?: string | null; // Fixed typo: Autheticate_Id → Authenticate_Id
    UserTypeId?: number | null;
    [key: string]: any;
}

type UserCreationAttributes = Optional<UserAttributes, 'UserId'>;

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    declare UserId: number;
    declare Name: string;
    declare Email: string | null;
    declare Mobile_No: string | null;
    declare Authenticate_Id: string | null; // Fixed typo
    declare UserTypeId: number | null;
}

User.init(
    {
        UserId: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            field: 'UserId'
        },
        Name: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'Name'
        },
        Email: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'Email'
        },
        Mobile_No: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'Mobile_No'
        },
        Authenticate_Id: { // Fixed typo
            type: DataTypes.STRING,
            allowNull: true,
            field: 'Authenticate_Id' // Fixed typo in field name
        },
        UserTypeId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'UserTypeId'
        }
    },
    {
        sequelize,
        tableName: 'tbl_Users',
        modelName: modelName,
        timestamps: false,
        freezeTableName: true
    }
);

export default User;