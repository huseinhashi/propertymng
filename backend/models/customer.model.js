import { DataTypes } from "sequelize";
import sequelize from "../database/db.js";

const Customer = sequelize.define("customer", {
  customer_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  address: {
    type: DataTypes.STRING,
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

export default Customer;
