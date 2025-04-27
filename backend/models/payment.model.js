import { DataTypes } from "sequelize";
import sequelize from "../database/db.js";

const Payment = sequelize.define("payment", {
  payment_id: {
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
  type: {
    type: DataTypes.ENUM("initial", "extra", "refund"),
    defaultValue: "initial",
  },
  reason: {
    type: DataTypes.STRING,
    defaultValue: "Initial payment",
  },
  status: {
    type: DataTypes.ENUM("pending", "paid", "refunded", "cancelled"),
    defaultValue: "pending",
  },
  paid_at: {
    type: DataTypes.DATE,
  },
  transaction_ref: {
    type: DataTypes.STRING,
    comment: "Reference ID from the payment gateway",
  },
});

export default Payment;
