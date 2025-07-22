import { Association, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model, NonAttribute } from "sequelize";
import { Difficulty, RecordType } from "types";
import { sequelize } from "..";
import Songs from "./songs";
import Users from "./users";


type RecordAttributes = {
    user_id: number
    song_id: number,
    difficulty: string,
    score: number,
    // other attributes...
};

export default class Records extends Model<InferAttributes<Records>, InferCreationAttributes<Records>> {
    declare id : number
    declare user_id: ForeignKey<number>;
    declare song_id: ForeignKey<number>;
    declare difficulty: Difficulty;
    declare score: number;
    declare updatedAt : Date;
    declare createdAt : Date
    declare type : RecordType
    declare static associations: {
        songs: Association<Records, Songs>;
    };

    declare song: NonAttribute<Songs>;

}

Records.init({
    // Model attributes are defined here
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,

    },
    song_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    difficulty: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    score: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue : "best"
    },
    createdAt : {
        type : DataTypes.DATE,   
    },
    updatedAt : {
        type : DataTypes.DATE,
    }

}, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    modelName: 'records' // We need to choose the model name
});
Users.hasMany(Records, { foreignKey: 'user_id' })
Records.belongsTo(Users, { foreignKey: 'user_id' })
Records.belongsTo(Songs, { foreignKey: 'song_id' })