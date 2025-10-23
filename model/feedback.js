import { sequelize, DataTypes } from "../config/dbconfig.js";

const Feedback = sequelize.define('feedback', {
   feedback_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    message: {
        type: DataTypes.STRING,
        allowNull: false,
   
    },
   rating : {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    timestamps: true,
    paranoid: true
});

export default Feedback;