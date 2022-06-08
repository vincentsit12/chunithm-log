const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('./db')

class Songs extends Model { }

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



module.exports = Songs