import { DataTypes } from "sequelize";
import sequelize from "../database/db.js";

const ServiceType = sequelize.define("service_type", {
  service_type_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  commission_percent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      min: 0,
      max: 100,
    },
  },
});

export default ServiceType;
