import { DataTypes } from "sequelize";
import sequelize from "../database/db.js";

const Payment = sequelize.define("payment", {
  payment_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  type: {
    type: DataTypes.ENUM("initial", "extra"),
    allowNull: false,
  },
  reason: {
    type: DataTypes.TEXT,
    defaultValue: "Initial payment",
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("pending", "paid"),
    defaultValue: "pending",
  },
  paid_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

export default Payment;
