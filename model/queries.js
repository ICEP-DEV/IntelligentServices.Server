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
    query_address: {
        type: DataTypes.STRING,
        allowNull: false,
   
    },
    region: {
        type: DataTypes.STRING,
        allowNull: false,
   
    },
    // citizen_id: {
    //     type: DataTypes.STRING(8),
    //     allowNull: false,
    //     references: {
    //         model: Citizen,
    //         key: 'citizen_id'
    //     },
    //     onUpdate: 'CASCADE',
    //     onDelete: 'CASCADE'
    // },
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
