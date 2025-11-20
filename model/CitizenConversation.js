import { sequelize, DataTypes } from "../config/dbconfig.js";

const CitizenConversation = sequelize.define(
  "CitizenConversation",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    citizen_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: "citizen",
        key: "citizen_id",
      },
      onDelete: "CASCADE",
    },
    conversation_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
  },
  {
    tableName: "CitizenConversations",
    timestamps: true,
  }
);

export default CitizenConversation;
