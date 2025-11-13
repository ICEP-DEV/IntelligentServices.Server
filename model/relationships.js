import Notification from "./notifications.js";
import { Citizen, Admin,MunicipalPersonnel} from "./user.js";
import {Query} from './queries.js'; 
import { QueryType ,Attachment} from "./queries.js";
import {UnResolvedQueries} from "./complaints.js"   ;
import Feedback from "./feedback.js";
import { Conversation, Message } from "./message.js";
import UserConversation from "./CitizenConversation.js";
import AdminConversation from "./AdminConversation.js";
import CitizenConversation from "./CitizenConversation.js";

Notification.belongsToMany(Citizen, 
    {through: 'CitizenNotifications',
    foreignKey: 'notification_id'
});

Citizen.belongsToMany(Notification,
    {through: 'CitizenNotifications', 
    foreignKey: 'citizen_id'
});

Query.belongsTo(Citizen, { foreignKey: 'citizen_id' });
Citizen.hasMany(Query,{ foreignKey: 'citizen_id' });

Query.belongsTo(QueryType, { foreignKey: 'querytype_id' });
QueryType.hasMany(Query,{ foreignKey: 'querytype_id' });

Query.belongsTo(Admin, { foreignKey: 'admin_id' });
Admin.hasMany(Query, { foreignKey: 'admin_id' });

Query.belongsToMany(MunicipalPersonnel, { through: "QueryAssignments", foreignKey: 'query_id' });
MunicipalPersonnel.belongsToMany(Query, { through: "QueryAssignments", foreignKey: 'municipality_id' });

Query.hasMany(Attachment, { foreignKey: 'query_id' });
Attachment.belongsTo(Query, { foreignKey: 'query_id' });

Query.hasMany(UnResolvedQueries, { foreignKey: 'query_id' });
UnResolvedQueries.belongsTo(Query, { foreignKey: "query_id" });

Citizen.hasMany(UnResolvedQueries, { foreignKey: 'citizen_id' });
UnResolvedQueries.belongsTo(Citizen, { foreignKey: 'citizen_id' });

Admin.hasMany(UnResolvedQueries, { foreignKey: 'admin_id' });
UnResolvedQueries.belongsTo(Admin, { foreignKey: 'admin_id' });

MunicipalPersonnel.hasMany(UnResolvedQueries, { foreignKey: 'municipality_id' });
UnResolvedQueries.belongsTo(MunicipalPersonnel, { foreignKey: 'municipality_id' });

Citizen.hasMany(Feedback, { foreignKey: "citizen_id" });
Feedback.belongsTo(Citizen, { foreignKey: "citizen_id" });

Admin.hasMany(Feedback, { foreignKey: "admin_id" });
Feedback.belongsTo(Admin, { foreignKey: "admin_id" });

// Citizen ↔ Conversation (via UserConversation)
Citizen.belongsToMany(Conversation, {
  through: CitizenConversation,
  foreignKey: "citizen_id",
});
Conversation.belongsToMany(Citizen, {
  through: CitizenConversation,
  foreignKey: "conversation_id",
});

// Admin ↔ Conversation (via UserConversation)
Admin.belongsToMany(Conversation, {
  through: AdminConversation,
  foreignKey: "admin_id",
});
Conversation.belongsToMany(Admin, {
  through: AdminConversation,
  foreignKey: "conversation_id",
});

// Conversation ↔ Message
Conversation.hasMany(Message, {
  foreignKey: "conversation_id",
  onDelete: "CASCADE",
});
Message.belongsTo(Conversation, {
  foreignKey: "conversation_id",
});

// Citizen ↔ Message
Citizen.hasMany(Message, {
  foreignKey: "senderId",
  sourceKey: "citizen_id",
  constraints: false, // No DB-level FK constraint as senderId is polymorphic
});
Message.belongsTo(Citizen, {
  foreignKey: "senderId",
  targetKey: "citizen_id",
  constraints: false,
});

// Admin ↔ Message
Admin.hasMany(Message, {
  foreignKey: "senderId",
  sourceKey: "admin_id",
  constraints: false,
});
Message.belongsTo(Admin, {
  foreignKey: "senderId",
  targetKey: "admin_id",
  constraints: false,
});

export { Citizen, Notification};