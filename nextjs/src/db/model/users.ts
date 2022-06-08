import { Association, DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "..";
import Records from "./records";

type UserAttributes = {
    id: Number;
    username: string
    password: string,
    isAdmin?: boolean,
    // other attributes...
};
type UserCreationAttributes = Optional<UserAttributes, 'id'>;


export default class Users extends Model<UserAttributes, UserCreationAttributes>{
    declare id: Number;
    declare username: string;
    declare password: string;
    declare isAdmin: boolean;
    // declare static associations: {
    //     records: Association<Users, Records>;
    // };
}

Users.init({
    // Model attributes are defined here
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    username: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
        validate: {
            len: [6, 12]
        }
    },
    password: {
        type: DataTypes.STRING(64),
        allowNull: false,
    },

    isAdmin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },

}, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    modelName: 'users' // We need to choose the model name
});


