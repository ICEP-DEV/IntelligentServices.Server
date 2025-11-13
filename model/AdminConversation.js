import { sequelize, DataTypes } from "../config/dbconfig.js";

const AdminConversation = sequelize.define(
  "AdminConversation",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    admin_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Admin",
        key: "admin_id",
      },
      onDelete: "CASCADE",
    },
    conversation_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Conversations",
        key: "conversation_id",
      },
      onDelete: "CASCADE",
    },
  },
  {
    tableName: "AdminConversations",
    timestamps: true,
  }
);

export default AdminConversation;