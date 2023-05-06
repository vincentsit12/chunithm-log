
const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('./db')

class Users extends Model {

    
 }

Users.init({
    // Model attributes are defined here

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
        // validate: {
        //     is: /^[0-9a-f]{64}$/i
        // }
    },
    isAdmin : {
        type: DataTypes.BOOLEAN,
        defaultValue : false,
        allowNull: false,
    },

    

}, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    modelName: 'users' // We need to choose the model name
});

module.exports = Users