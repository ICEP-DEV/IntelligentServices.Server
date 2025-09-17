import dotenv from 'dotenv';
import { Sequelize, DataTypes } from 'sequelize';

dotenv.config();
//ORM
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect:'mysql',
    port: process.env.DB_PORT,
    logging: false
});

export { sequelize, DataTypes };