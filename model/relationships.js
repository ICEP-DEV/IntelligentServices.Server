import Notification from "./notifications.js";
import { Citizen, Admin,MunicipalPersonnel} from "./user.js";
import {Query} from './queries.js'; 
import { QueryType ,Attachment} from "./queries.js";
import {UnResolvedQueries} from "./complaints.js"   ;
import Feedback from "./feedback.js";


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



export { Citizen, Notification};