import { sequelize, DataTypes } from "../config/dbconfig.js";

const AdminReport = sequelize.define('adminReport', {
    report_id: {
        type: DataTypes.STRING(10),
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    queries: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    complaints: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    false_queries: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    urgent_queries: {
        type: DataTypes.INTEGER,        
        allowNull: false
    },
    generated_by: {
        type: DataTypes.STRING(10),
        allowNull: false
    }
}, {
    timestamps: true,
    paranoid: true,
    freezeTableName: true
});


const TechnicianReport = sequelize.define('technicianReport', {
    report_id: {
        type: DataTypes.STRING(10),
        primaryKey: true,
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    queries_resolved: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    urgent_queries_resolved: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    technician_id: {
        type: DataTypes.STRING(10),
        allowNull: false
    }
}, {
    timestamps: true,
    paranoid: true,
    freezeTableName: true
});

export {AdminReport} ;