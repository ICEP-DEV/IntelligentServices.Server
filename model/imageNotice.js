import { sequelize, DataTypes } from "../config/dbconfig.js";

/**
 * Defines the ImageNotice model.
 */
const ImageNotice = sequelize.define('ImageNotice', {
  // A unique identifier for the image notice.
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  description: {
    type: DataTypes.TEXT,
  },
  image_data: {
    type: DataTypes.BLOB('long'),
    allowNull: false,
  },
  mime_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  display_order: {
    type: DataTypes.INTEGER,
  },
});

export default ImageNotice;