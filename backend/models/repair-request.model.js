import { DataTypes } from "sequelize";
import sequelize from "../database/db.js";

const RepairRequest = sequelize.define("repair_request", {
  request_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  service_type_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM("pending", "bidding", "closed", "rejected"),
    defaultValue: "pending",
  },
});

export default RepairRequest;
