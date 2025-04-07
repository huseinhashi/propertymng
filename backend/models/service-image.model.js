import { DataTypes } from "sequelize";
import sequelize from "../database/db.js";

const ServiceImage = sequelize.define("service_image", {
  image_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

export default ServiceImage;
