import { DataTypes } from "sequelize";
import sequelize from "../database/db.js";

const Bid = sequelize.define("bid", {
  bid_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  expert_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  request_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: "Number of units (e.g., 2 for 2 days)",
  },
  duration_unit: {
    type: DataTypes.ENUM("hours", "days", "weeks"),
    allowNull: false,
    comment: "Unit of duration (hours, days, or weeks)",
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: "",
  },
  is_accepted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

export default Bid;
