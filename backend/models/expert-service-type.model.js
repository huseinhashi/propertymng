import { DataTypes } from "sequelize";
import sequelize from "../database/db.js";

const ExpertServiceType = sequelize.define("expert_service_type", {
  expert_service_type_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  expert_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  service_type_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

export default ExpertServiceType;
