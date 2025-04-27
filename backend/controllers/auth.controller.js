import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/env.js";
import Expert from "../models/expert.model.js";
import Customer from "../models/customer.model.js";
import Admin from "../models/admin.model.js";
import ExpertServiceType from "../models/expert-service-type.model.js";
import ServiceType from "../models/service-type.model.js";
import { validationResult } from "express-validator";
import sequelize from "../database/db.js";

// Helper function to generate JWT
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Expert Registration
export const registerExpert = async (req, res, next) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { full_name, email, password, service_type_ids, address } = req.body;

    const existingExpert = await Expert.findOne({ where: { email } });
    if (existingExpert) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      const expert = await Expert.create(
        {
          full_name,
          email,
          password_hash: hashedPassword,
          address,
        },
        { transaction }
      );

      // Add service types
      if (service_type_ids && service_type_ids.length > 0) {
        const expertServiceTypes = service_type_ids.map((service_type_id) => ({
          expert_id: expert.expert_id,
          service_type_id,
        }));

        await ExpertServiceType.bulkCreate(expertServiceTypes, { transaction });
      }

      await transaction.commit();

      res.status(201).json({
        success: true,
        message: "Expert registered successfully",
        data: {
          id: expert.expert_id,
          full_name: expert.full_name,
          email: expert.email,
        },
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// Expert Login
export const loginExpert = async (req, res, next) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const expert = await Expert.findOne({
      where: { email },
      include: [ServiceType],
    });

    if (!expert) {
      return res.status(404).json({ message: "Expert not found" });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      expert.password_hash
    );
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = generateToken({
      expert_id: expert.expert_id,
      role: "expert",
    });

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      data: {
        token,
        expert: {
          id: expert.expert_id,
          full_name: expert.full_name,
          email: expert.email,
          service_types: expert.service_types,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Customer Registration
export const registerCustomer = async (req, res, next) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, address, password } = req.body;

    const existingCustomer = await Customer.findOne({ where: { phone } });
    if (existingCustomer) {
      return res
        .status(400)
        .json({ message: "Phone number already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const customer = await Customer.create({
      name,
      phone,
      address,
      password_hash: hashedPassword,
    });

    res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      data: {
        id: customer.customer_id,
        name: customer.name,
        phone: customer.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Customer Login
export const loginCustomer = async (req, res, next) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, password } = req.body;

    const customer = await Customer.findOne({ where: { phone } });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      customer.password_hash
    );
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = generateToken({
      customer_id: customer.customer_id,
      role: "customer",
    });

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      data: {
        token,
        customer: {
          id: customer.customer_id,
          name: customer.name,
          phone: customer.phone,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin Login
export const loginAdmin = async (req, res, next) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = generateToken({ admin_id: admin.admin_id, role: "admin" });

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      data: {
        token,
        admin: {
          id: admin.admin_id,
          name: admin.name,
          email: admin.email,
          role: "admin",
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
