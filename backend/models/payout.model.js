import { DataTypes } from "sequelize";
import sequelize from "../database/db.js";

const Payout = sequelize.define("payout", {
  payout_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  service_order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  total_payment: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  commission: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
  },
  net_payout: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  payout_status: {
    type: DataTypes.ENUM("pending", "released"),
    defaultValue: "pending",
  },
  released_at: {
    type: DataTypes.DATE,
  },
  expert_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

export default Payout;
