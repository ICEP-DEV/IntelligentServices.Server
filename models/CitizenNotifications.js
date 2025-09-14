import { sequelize, DataTypes } from './config.js';

const CitizenNotifications = sequelize.define('CitizenNotifications', {
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true
});

export default CitizenNotifications;
