
const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('./db')

class Records extends Model {



 }

Records.init({
    // Model attributes are defined here

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


    

}, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    modelName: 'records' // We need to choose the model name
});

module.exports = Records