import sequelize from "./db.js";
import Admin from "../models/admin.model.js";
import bcrypt from "bcryptjs";

export const seedAdminIfNoneExists = async () => {
  try {
    // Check if any admin exists
    const adminCount = await Admin.count();
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash("123456", 10);
      await Admin.create({
        name: "Default Admin",
        email: "admin@property.com",
        password: hashedPassword,
      });
      console.log("Default admin seeded: admin@property.com / 123456");
    } else {
      console.log("Admin already exists, skipping seeding.");
    }
  } catch (error) {
    console.error("Error seeding admin:", error);
  }
};
