import { sequelize, DataTypes } from "./config.js";
import crypto from 'crypto';

const QueryType = sequelize.define('queryType', {
   querytype_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
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
       type: DataTypes.UUID,
       allowNull: false, // or true if optional
       references: {
           model: 'queryTypes', // table name of QueryType
           key: 'querytype_id'
       }
   }
}, {
    timestamps: true,
    paranoid: true
});

const Attachments = sequelize.define("attachments", {
  photo_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
 
  photo_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  query_id: {
    type: DataTypes.STRING(10), 
    allowNull: false,
    references: {
      model: Query,
      key: "query_id"
    }
  }
}, {
  timestamps: true,
  paranoid: true
});

export {QueryType,Query,Attachments };

