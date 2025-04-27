import { DataTypes } from "sequelize";
import sequelize from "../database/db.js";

const Rating = sequelize.define("rating", {
  rating_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  service_order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 10,
    },
  },
  feedback: {
    type: DataTypes.TEXT,
  },
});

export default Rating;
