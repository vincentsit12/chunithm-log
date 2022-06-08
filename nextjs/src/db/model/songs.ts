import { DataTypes, Model } from "sequelize";
import { sequelize } from "..";


type SongAttributes = {
    name: string
    master?: Number,
    expert?: Number,
    ultima?: Number,
    // other attributes...
};

export default class Songs extends Model<SongAttributes> {
    declare name: string;
    declare master: Number;
    declare expert: Number;
    declare ultima: boolean;
}

Songs.init({
    // Model attributes are defined here
    name: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    master: {
        type: DataTypes.DOUBLE,
    },
    ultima: {
        type: DataTypes.DOUBLE,
    },
    expert: {
        type: DataTypes.DOUBLE,
    },


}, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    modelName: 'songs' // We need to choose the model name
});