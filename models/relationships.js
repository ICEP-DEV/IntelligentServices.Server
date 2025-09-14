import Notification from "./notifications.js";
import { Citizen } from "./user.js";


Notification.belongsToMany(Citizen, 
    {through: 'CitizenNotifications',
    foreignKey: 'notification_id'
});

Citizen.belongsToMany(Notification,
    {through: 'CitizenNotifications', 
    foreignKey: 'citizen_id'
});

export { Citizen, Notification };