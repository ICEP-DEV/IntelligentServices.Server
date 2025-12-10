import { sequelize, DataTypes } from "../config/dbconfig.js";
import crypto from 'crypto';
import { Citizen } from './user.js';

const QueryType = sequelize.define('queryType', {
   querytype_id: {
         type: DataTypes.STRING(10),
        defaultValue: () => crypto.randomBytes(5).toString('hex'),
        primaryKey: true
    },
    query_type: {
        type: DataTypes.STRING,
        allowNull: false,
   
    },
   query_subtype : {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    timestamps: true,
    paranoid: true
});

const Query = sequelize.define('query', {
   query_id: {
        type: DataTypes.STRING(10),
        defaultValue: () => crypto.randomBytes(5).toString('hex'),
        primaryKey: true
    },
    query_description: {
        type: DataTypes.STRING,
        allowNull: false,
   
    },
   query_status: {
       type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'submitted'
   },
    isAssigned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    municipality_id: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    query_address: {
        type: DataTypes.STRING,
        allowNull: false,
   
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    region: {
        type: DataTypes.STRING,
        allowNull: false,
   
    },
    set_priotity_score: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue:0,
        validate: {
            min: 0,
            max:100
        }
    },
    priority_status: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "low",
    },
    old_status: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "low",
    }
},
    {
    timestamps: true,
    paranoid: true
});


const Attachment = sequelize.define('attachment', {
    photo_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
     
    photo_path: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    complaint_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    
}, {
    timestamps: true,
    paranoid: true
});


export {QueryType,Query,Attachment};
