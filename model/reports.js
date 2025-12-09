import { sequelize, DataTypes } from "../config/dbconfig.js";

const AdminReport = sequelize.define('adminReport', {
    report_id: {
        type: DataTypes.INTEGER,
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


const TechnicianReport = sequelize.define("technicianReport", {
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  queryName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  workSummary: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  issuesFaced: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  hoursWorked: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  recommendations: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  timestamps: true,
});

export  {AdminReport ,TechnicianReport};
