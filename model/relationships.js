import Notification from "./notifications.js";
import { Citizen, Admin,MunicipalPersonnel} from "./user.js";
import {Query} from './queries.js'; 
import { QueryType ,Attachments} from "./queries.js";   
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

Query.belongsTo(MunicipalPersonnel, { foreignKey: 'municipality_id' });
MunicipalPersonnel.hasMany(Query, { foreignKey: 'municipality_id' });

Query.hasMany(Attachments, { foreignKey: "query_id" });
Attachments.belongsTo(Query, { foreignKey: "query_id" });

Feedback.belongsTo(Citizen, {foreignKey: 'citizen_id'});
Citizen.hasMany(Feedback, {foreignKey: 'citizen_id'});


export { Citizen, Notification};