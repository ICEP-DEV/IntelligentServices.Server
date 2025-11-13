import { sequelize, DataTypes } from "../config/dbconfig.js";



const UnResolvedQueries = sequelize.define('unresolvedQueries', {
        id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    query_type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    reference: {
    type: DataTypes.STRING,
    allowNull: false
    },
     description: {
        type: DataTypes.STRING,
        allowNull: false
    },
       complaint_status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'submitted'
    },
}
, {
    timestamps: true,
    paranoid: true
});

export {UnResolvedQueries}
