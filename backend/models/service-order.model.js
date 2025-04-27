import { DataTypes } from "sequelize";
import sequelize from "../database/db.js";

const ServiceOrder = sequelize.define("service_order", {
  service_order_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  bid_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  base_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  extra_price: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.0,
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("in_progress", "completed", "delivered", "refunded"),
    defaultValue: "in_progress",
  },
  payment_status: {
    type: DataTypes.ENUM(
      "unpaid",
      "partially_paid",
      "fully_paid",
      "in_hand",
      "refunded"
    ),
    defaultValue: "unpaid",
  },
  completion_notes: {
    type: DataTypes.TEXT,
    defaultValue: "",
  },
  deadline: {
    type: DataTypes.DATE,
  },
  completed_at: {
    type: DataTypes.DATE,
  },
});

export default ServiceOrder;
