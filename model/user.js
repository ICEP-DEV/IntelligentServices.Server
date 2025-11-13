import { UUIDV4 } from 'sequelize';
import { sequelize, DataTypes } from '../config/dbconfig.js';
import Notification from './notifications.js';
import crypto from 'crypto';

// Citizen user
const Citizen = sequelize.define('citizen', {
    citizen_id: {
         type: DataTypes.STRING(8),
                defaultValue: () => crypto.randomBytes(4).toString('hex'),
                primaryKey: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
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
    },
    isSuspended: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    is_Verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    timestamps: true,
    paranoid: true,
    freezeTableName: true
});

// Admin user
const Admin = sequelize.define('Admin', {
  admin_id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: UUIDV4, 
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
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
    region: {
        type: DataTypes.STRING,
        allowNull: false,
   
    },
    isSuspended: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    }
},{
    timestamps: true,
    freezeTableName: true
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
     region: {
        type: DataTypes.STRING,
        allowNull: false,

    },
    isSuspended: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    isSupervisor: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    timestamps: true,
    paranoid: true,
    freezeTableName: true
});


export { 
    Citizen,
    Admin,
    MunicipalPersonnel,
    sequelize
};
