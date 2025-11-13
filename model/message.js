import { sequelize, DataTypes } from '../config/dbconfig.js';

const Message = sequelize.define("Messages", {
    message_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    conversation_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: true,
        references: {
            model: 'Conversations',
            key: 'conversation_id'
        },
        onDelete: 'CASCADE',
        // onUpdate: 'CASCADE'
    },
    senderId: {
        type: DataTypes.STRING,
        allowNull: false,
        constraints: false // Explicitly disable foreign key constraints for this polymorphic column
    },
    text: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    seen: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    }
})

const Conversation = sequelize.define("Conversations", {
    conversation_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        primaryKey: true
    },
    is_group: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
})

export {Message,Conversation};