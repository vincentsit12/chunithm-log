import { Sequelize } from "sequelize";

export const sequelize = new Sequelize(process.env.DB_NAME as string, process.env.DB_USERNAME as string, process.env.DB_PASSWORD, {
    host: process.env.NODE_ENV === 'development' ? 'localhost' : 'db',
    dialect: 'postgres',
    port: Number(process.env.DB_PORT),
});