'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Records extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {

      Records.belongsTo(models.users, { foreignKey: 'user_id' })
      Records.belongsTo(models.songs, { foreignKey: 'song_id' }) 
    }
  }
  Records.init({

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
    // type: {
    //   type: DataTypes.STRING,
    //   allowNull: false,
    //   defaultValue: "best"
    // },
  }, {
    sequelize,
    modelName: 'records',
  });
  return Records;
};