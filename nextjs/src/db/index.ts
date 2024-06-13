import { Sequelize } from "sequelize";

export const sequelize = new Sequelize(
    process.env.DB_NAME as string,
    process.env.DB_USERNAME as string,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: "postgres",
        port: Number(process.env.DB_PORT),
        ...(process.env.DB_SSL === "true"
            ? {
                dialectOptions: {
                    ssl: {
                        rejectUnauthorized: false,
                    }
                },
            }
            : ({} as any)),
    }
); 