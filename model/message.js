import { sequelize, DataTypes } from "../config/dbconfig.js";

const Conversation = sequelize.define(
  "Conversation",
  {
    conversation_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    is_group: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "Conversations",
    timestamps: true,
  }
);

const Message = sequelize.define(
  "Message",
  {
    message_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    conversation_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    senderId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    text: {
      type: DataTypes.TEXT,
    },
    image_url: { // New field for image URLs
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "Messages",
    timestamps: true,
  }
);

export { Conversation, Message };