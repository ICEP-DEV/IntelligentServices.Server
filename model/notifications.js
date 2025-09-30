import { sequelize, DataTypes } from "../config/dbconfig.js";
import { Citizen } from "./user.js";

//Notification table
const Notification = sequelize.define('notifications', {
    notification_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    message: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    area: {
        type: DataTypes.STRING,
        allowNull: true
    },
},{
    timestamps: true,
    paranoid: true
})



export default Notification;