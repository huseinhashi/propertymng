import { DataTypes } from "sequelize";
import sequelize from "../database/db.js";

const Bid = sequelize.define("bid", {
  bid_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  is_accepted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

export default Bid;
