import Expert from "../models/expert.model.js";
import ExpertServiceType from "../models/expert-service-type.model.js";
import ServiceType from "../models/service-type.model.js";
import { Op } from "sequelize";
import sequelize from "../database/db.js";
import bcrypt from "bcryptjs";

// Get all experts with optional search
export const getAllExperts = async (req, res, next) => {
  try {
    const { search } = req.query;

    const query = search
      ? {
          [Op.or]: [
            { full_name: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
            { address: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    const experts = await Expert.findAll({
      where: query,
      include: [
        {
          model: ServiceType,
          through: { attributes: [] }, // Don't include the join table
        },
      ],
    });

    res.status(200).json({
      success: true,
      data: experts,
    });
  } catch (error) {
    next(error);
  }
};

// Create a new expert
export const createExpert = async (req, res, next) => {
  try {
    const { full_name, email, password, service_type_ids, address } = req.body;

    const existingExpert = await Expert.findOne({ where: { email } });
    if (existingExpert) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      const expert = await Expert.create(
        {
          full_name,
          email,
          password_hash: hashedPassword, // Hashing should be implemented
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

      // Fetch expert with service types
      const expertWithServices = await Expert.findByPk(expert.expert_id, {
        include: [ServiceType],
      });

      res.status(201).json({
        success: true,
        message: "Expert created successfully",
        data: expertWithServices,
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// Update an expert
export const updateExpert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, email, password, service_type_ids, address } = req.body;

    const expert = await Expert.findByPk(id);
    if (!expert) {
      return res.status(404).json({
        success: false,
        message: "Expert not found",
      });
    }

    if (email && email !== expert.email) {
      const existingExpert = await Expert.findOne({ where: { email } });
      if (existingExpert) {
        return res.status(400).json({
          success: false,
          message: "Email already registered",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      expert.full_name = full_name || expert.full_name;
      expert.email = email || expert.email;
      expert.address = address || expert.address;
      if (password) {
        expert.password_hash = hashedPassword; // Hashing should be implemented
      }

      await expert.save({ transaction });

      // Update service types if provided
      if (service_type_ids && service_type_ids.length > 0) {
        // Remove existing service types
        await ExpertServiceType.destroy({
          where: { expert_id: expert.expert_id },
          transaction,
        });

        // Add new service types
        const expertServiceTypes = service_type_ids.map((service_type_id) => ({
          expert_id: expert.expert_id,
          service_type_id,
        }));

        await ExpertServiceType.bulkCreate(expertServiceTypes, { transaction });
      }

      await transaction.commit();

      // Fetch updated expert with service types
      const updatedExpert = await Expert.findByPk(expert.expert_id, {
        include: [ServiceType],
      });

      res.status(200).json({
        success: true,
        message: "Expert updated successfully",
        data: updatedExpert,
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// Delete an expert
export const deleteExpert = async (req, res, next) => {
  try {
    const { id } = req.params;

    const expert = await Expert.findByPk(id);
    if (!expert) {
      return res.status(404).json({
        success: false,
        message: "Expert not found",
      });
    }
    await expert.destroy();

    res.status(200).json({
      success: true,
      message: "Expert deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
