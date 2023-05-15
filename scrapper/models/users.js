'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Users extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Users.hasMany(models.records, { foreignKey: 'user_id' })

    }
  }
  Users.init({

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
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'users',
  });
  return Users;
};