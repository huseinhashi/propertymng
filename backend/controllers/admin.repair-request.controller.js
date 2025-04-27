import RepairRequest from "../models/repair-request.model.js";
import ServiceImage from "../models/service-image.model.js";
import Customer from "../models/customer.model.js";
import ServiceType from "../models/service-type.model.js";
import sequelize from "../database/db.js";
import { Op } from "sequelize";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all repair requests with filtering options
export const getAllRepairRequests = async (req, res, next) => {
  try {
    const {
      search,
      status,
      customer_id,
      service_type_id,
      sort_by = "createdAt",
      sort_order = "DESC",
    } = req.query;

    // Build filter conditions
    const whereConditions = {};

    if (search) {
      whereConditions[Op.or] = [
        { description: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } },
      ];
    }

    if (status) {
      whereConditions.status = status;
    }

    if (customer_id) {
      whereConditions.customer_id = customer_id;
    }

    if (service_type_id) {
      whereConditions.service_type_id = service_type_id;
    }

    // Build sort order
    const order = [[sort_by, sort_order]];

    // Get repair requests with associated data
    const repairRequests = await RepairRequest.findAll({
      where: whereConditions,
      include: [
        { model: Customer },
        { model: ServiceType },
        { model: ServiceImage },
      ],
      order,
    });

    res.status(200).json({
      success: true,
      count: repairRequests.length,
      data: repairRequests,
    });
  } catch (error) {
    next(error);
  }
};

// Get repair request by ID
export const getRepairRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const repairRequest = await RepairRequest.findByPk(id, {
      include: [
        { model: Customer },
        { model: ServiceType },
        { model: ServiceImage },
      ],
    });

    if (!repairRequest) {
      return res.status(404).json({
        success: false,
        message: "Repair request not found",
      });
    }

    res.status(200).json({
      success: true,
      data: repairRequest,
    });
  } catch (error) {
    next(error);
  }
};

// Create a repair request (admin can select customer)
export const createRepairRequest = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      customer_id,
      description,
      location,
      service_type_id,
      status = "pending",
    } = req.body;

    // Validate required fields
    if (!customer_id || !description || !location) {
      return res.status(400).json({
        success: false,
        message: "Customer ID, description, and location are required",
      });
    }

    // Check if customer exists
    const customer = await Customer.findByPk(customer_id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Create repair request
    const repairRequest = await RepairRequest.create(
      {
        customer_id,
        description,
        location,
        service_type_id, // Can be null initially
        status,
      },
      { transaction }
    );

    // Process images if any
    const uploadedImages = [];

    if (req.files && req.files.length > 0) {
      const uploadsDir = path.join(__dirname, "../uploads");

      // Create uploads directory if it doesn't exist
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Process each uploaded image
      for (const file of req.files) {
        const fileExt = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}${fileExt}`;
        const filePath = path.join(uploadsDir, fileName);

        // Write file to uploads directory
        fs.writeFileSync(filePath, file.buffer);

        // Create image record in database
        const image = await ServiceImage.create(
          {
            request_id: repairRequest.request_id,
            url: fileName,
          },
          { transaction }
        );

        uploadedImages.push(image);
      }
    }

    await transaction.commit();

    // Fetch complete repair request with associations
    const completeRepairRequest = await RepairRequest.findByPk(
      repairRequest.request_id,
      {
        include: [
          { model: Customer },
          { model: ServiceType },
          { model: ServiceImage },
        ],
      }
    );

    res.status(201).json({
      success: true,
      message: "Repair request created successfully",
      data: completeRepairRequest,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Update repair request (including assigning service type)
export const updateRepairRequest = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { customer_id, description, location, service_type_id, status } =
      req.body;

    // Find repair request
    const repairRequest = await RepairRequest.findByPk(id);
    if (!repairRequest) {
      return res.status(404).json({
        success: false,
        message: "Repair request not found",
      });
    }

    // Update fields if provided
    if (customer_id) {
      // Check if customer exists
      const customer = await Customer.findByPk(customer_id);
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }
      repairRequest.customer_id = customer_id;
    }

    if (service_type_id) {
      // Check if service type exists
      const serviceType = await ServiceType.findByPk(service_type_id);
      if (!serviceType) {
        return res.status(404).json({
          success: false,
          message: "Service type not found",
        });
      }
      repairRequest.service_type_id = service_type_id;
    }

    if (description) repairRequest.description = description;
    if (location) repairRequest.location = location;
    if (status) repairRequest.status = status;

    await repairRequest.save({ transaction });

    // Process new images if any
    if (req.files && req.files.length > 0) {
      const uploadsDir = path.join(__dirname, "../uploads");

      // Create uploads directory if it doesn't exist
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Process each uploaded image
      for (const file of req.files) {
        const fileExt = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}${fileExt}`;
        const filePath = path.join(uploadsDir, fileName);

        // Write file to uploads directory
        fs.writeFileSync(filePath, file.buffer);

        // Create image record in database
        await ServiceImage.create(
          {
            request_id: repairRequest.request_id,
            url: fileName,
          },
          { transaction }
        );
      }
    }

    await transaction.commit();

    // Fetch updated repair request with associations
    const updatedRepairRequest = await RepairRequest.findByPk(id, {
      include: [
        { model: Customer },
        { model: ServiceType },
        { model: ServiceImage },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Repair request updated successfully",
      data: updatedRepairRequest,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Delete repair request and associated images
export const deleteRepairRequest = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    // Find repair request
    const repairRequest = await RepairRequest.findByPk(id, {
      include: [ServiceImage],
    });

    if (!repairRequest) {
      return res.status(404).json({
        success: false,
        message: "Repair request not found",
      });
    }

    // Delete associated images from disk
    if (
      repairRequest.service_images &&
      repairRequest.service_images.length > 0
    ) {
      const uploadsDir = path.join(__dirname, "../uploads");

      for (const image of repairRequest.service_images) {
        const imagePath = path.join(uploadsDir, image.url);

        // Delete file if it exists
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
    }

    // Delete repair request (will cascade delete associated records)
    await repairRequest.destroy({ transaction });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Repair request deleted successfully",
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Get a list of customers for dropdown
export const getCustomersList = async (req, res, next) => {
  try {
    const customers = await Customer.findAll({
      attributes: ["customer_id", "name", "phone"],
      order: [["name", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};

// Get a list of service types for dropdown
export const getServiceTypesList = async (req, res, next) => {
  try {
    const serviceTypes = await ServiceType.findAll({
      attributes: ["service_type_id", "name"],
      order: [["name", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: serviceTypes,
    });
  } catch (error) {
    next(error);
  }
};
