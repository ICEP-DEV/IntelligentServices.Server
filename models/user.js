import { sequelize, DataTypes } from './config.js';
import Notification from './notifications.js';

// Citizen user
const Citizen = sequelize.define('citizen', {
    citizen_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,  // auto-generate UUID
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    locationAddress: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    area: {
        type: DataTypes.STRING,
        allowNull:true,
    },
    firstname: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    lastname: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    timestamps: true,
    paranoid: true 
});

// Admin user
const Admin = sequelize.define('Admin', {
  admin_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true, 
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isSuperAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  firstname: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastname: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Municipal personnel user
const MunicipalPersonnel = sequelize.define('municipalPersonnel', {
    municipality_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    firstname: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    lastname: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    timestamps: true,
    paranoid: true
});


export { 
    Citizen,
    Admin,
    MunicipalPersonnel,
    sequelize
};

