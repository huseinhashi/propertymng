import { DataTypes } from "sequelize";
import sequelize from "../database/db.js";

const RefundRequest = sequelize.define("refund_request", {
  refund_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  service_order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("requested", "approved", "rejected"),
    defaultValue: "requested",
  },
  decision_notes: {
    type: DataTypes.TEXT,
  },
  decided_at: {
    type: DataTypes.DATE,
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

export default RefundRequest;
