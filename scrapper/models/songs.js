'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Songs extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */

    static associate(models) {
      // define association here
    }
  }
  Songs.init({
    name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    display_name: { type: DataTypes.TEXT, },
    master: {
      type: DataTypes.JSONB,
    },
    ultima: {
      type: DataTypes.JSONB,
    },
    expert: {
      type: DataTypes.JSONB,
    },
    youtube_link: { type: DataTypes.TEXT, },
    
  }, {
    sequelize,
    modelName: 'songs',
  });
  return Songs;
};