import { DataTypes } from "sequelize";
import sequelize from "../database/db.js";

const Payout = sequelize.define("payout", {
  payout_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
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
    // Sequelize does not support `GENERATED ALWAYS AS` directly, so we calculate this in the application logic.
  },
  payout_status: {
    type: DataTypes.ENUM("pending", "released"),
    defaultValue: "pending",
  },
  released_at: {
    type: DataTypes.DATE,
  },
});

export default Payout;
