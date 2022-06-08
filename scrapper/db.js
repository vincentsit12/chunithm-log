const { Sequelize, DataTypes, Model } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    host: 'db',
    dialect: 'postgres',
    port: process.env.DB_PORT
});

module.exports = sequelize