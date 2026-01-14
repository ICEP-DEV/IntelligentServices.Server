import { sequelize, DataTypes } from "../config/dbconfig.js";

const Otp = sequelize.define(
  "otp",
  {
    otp_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    user_id: {
      type: DataTypes.STRING, // UUID or string ID → works for all user types
      allowNull: false,
    },

    role: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    type: {
      type: DataTypes.STRING,
      defaultValue: "verification",
    },

    otp: {
      type: DataTypes.STRING(6),
      allowNull: false,
    },

    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    paranoid: true,

    indexes: [
      {
        name: "otp_user_role_type_idx",
        fields: ["user_id", "role", "type"],
      },
      {
        name: "otp_expiration_idx",
        fields: ["expires_at"],
      },
    ],
  }
);

export default Otp;
