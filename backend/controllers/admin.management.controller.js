import Admin from "../models/admin.model.js";

// Get all admins
export const getAllAdmins = async (req, res, next) => {
  try {
    const admins = await Admin.findAll();
    res.status(200).json({
      success: true,
      data: admins,
    });
  } catch (error) {
    next(error);
  }
};

// Create a new admin
export const createAdmin = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingAdmin = await Admin.findOne({ where: { email } });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const admin = await Admin.create({
      name,
      email,
      password, // Hashing should be implemented
    });

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: admin,
    });
  } catch (error) {
    next(error);
  }
};

// Update an admin
export const updateAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    if (email && email !== admin.email) {
      const existingAdmin = await Admin.findOne({ where: { email } });
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: "Email already registered",
        });
      }
    }

    admin.name = name || admin.name;
    admin.email = email || admin.email;
    if (password) {
      admin.password = password; // Hashing should be implemented
    }

    await admin.save();

    res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      data: admin,
    });
  } catch (error) {
    next(error);
  }
};

// Delete an admin
export const deleteAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const adminCount = await Admin.count();
    if (adminCount === 1) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete the last admin",
      });
    }

    await admin.destroy();

    res.status(200).json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
