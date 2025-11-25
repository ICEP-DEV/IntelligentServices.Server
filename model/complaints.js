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

const ComplaintAttachments = sequelize.define('complaintAttachments', {
      photo_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
     
    photo_path: {
        type: DataTypes.STRING,
        allowNull: true,
    },
},
    {
    timestamps: true,
    paranoid: true
});


export {UnResolvedQueries, ComplaintAttachments};
