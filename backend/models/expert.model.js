import { DataTypes } from "sequelize";
import sequelize from "../database/db.js";

const Expert = sequelize.define("expert", {
  expert_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  bio: {
    type: DataTypes.TEXT,
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  service_type_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

export default Expert;
