import { sequelize, DataTypes } from "../config/dbconfig.js";

/**
 * Defines the GeneralNotice model.
 */
const GeneralNotice = sequelize.define('GeneralNotice', {
  // A unique identifier for each notice.
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // The text content of the notice.
  notice_text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  // The date to be displayed, stored as a flexible string (e.g., "10 Sept").
  display_date: {
    type: DataTypes.STRING(20),
  },
  // The region associated with the notice.
  region: {
    type: DataTypes.STRING,
  },
  // An integer to control the display order.
  display_order: {
    type: DataTypes.INTEGER,
  },
});

export default GeneralNotice;