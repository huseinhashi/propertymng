import { DataTypes } from "sequelize";
import sequelize from "../database/db.js";

const RefundRequest = sequelize.define("refund_request", {
  refund_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("requested", "approved", "rejected"),
    defaultValue: "requested",
  },
});

export default RefundRequest;
