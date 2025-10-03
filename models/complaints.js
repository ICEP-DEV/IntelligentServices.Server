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
    query_service: {
        type: DataTypes.STRING,
        allowNull: false
    },
     description: {
        type: DataTypes.STRING,
        allowNull: false
    },
}
, {
    timestamps: true,
    paranoid: true
});

export {UnResolvedQueries}
