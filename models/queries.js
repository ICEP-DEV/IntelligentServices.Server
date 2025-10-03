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
    defaultValue: 'pending'
   },
    query_address: {
        type: DataTypes.STRING,
        allowNull: false,
   
    },
 querytype_id: {
        type: DataTypes.STRING(10),
        allowNull: false,
        references: {
            model: QueryType,
            key: 'querytype_id'
        }
    },
 citizen_id: {
        type: DataTypes.STRING(8),
        allowNull: false,
        references: {
            model: Citizen,
            key: 'citizen_id'
        }
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
     
    photo_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    
    query_id: {
        type: DataTypes.STRING(10),
        allowNull: false,
        references: {
            model: Query,
            key: 'query_id'
        }
    }
}, {
    timestamps: true,
    paranoid: true
});

export {QueryType,Query,Attachment};

