import RepairRequest from "../models/repair-request.model.js";
import ServiceImage from "../models/service-image.model.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import sequelize from "../database/db.js";
import ServiceType from "../models/service-type.model.js";
import Bid from "../models/bid.model.js";
import Expert from "../models/expert.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a new repair request (for customers)
export const createRepairRequest = async (req, res, next) => {
  // Start a transaction
  const transaction = await sequelize.transaction();

  try {
    const { description, location, service_type_id } = req.body;

    // Validate required fields
    if (!description || !location || !service_type_id) {
      return res.status(400).json({
        success: false,
        message: "Description, location, and service type are required",
      });
    }

    // Validate description length
    if (description.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Description must be at least 10 characters",
      });
    }

    // Validate location length
    if (location.length < 5) {
      return res.status(400).json({
        success: false,
        message: "Location must be at least 5 characters",
      });
    }

    // Validate service type exists
    const serviceType = await ServiceType.findByPk(service_type_id);
    if (!serviceType) {
      return res.status(400).json({
        success: false,
        message: "Invalid service type",
      });
    }

    // Get customer ID from authenticated user in middleware
    const customerId = req.user.customer_id;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Create the repair request
    const repairRequest = await RepairRequest.create(
      {
        customer_id: customerId,
        description,
        location,
        service_type_id,
        status: "pending",
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
        const fileName = `${uuidv4()}${fileExt}`;
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

    res.status(201).json({
      success: true,
      message: "Repair request created successfully",
      data: {
        repairRequest,
        images: uploadedImages,
      },
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Get repair requests for the authenticated customer
export const getCustomerRepairRequests = async (req, res, next) => {
  try {
    const customerId = req.user.customer_id;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const repairRequests = await RepairRequest.findAll({
      where: { customer_id: customerId },
      include: [ServiceImage],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: repairRequests,
    });
  } catch (error) {
    next(error);
  }
};

// Get a specific repair request by ID (for the authenticated customer)
export const getCustomerRepairRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customerId = req.user.customer_id;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const repairRequest = await RepairRequest.findOne({
      where: {
        request_id: id,
        customer_id: customerId,
      },
      include: [
        { model: ServiceImage, as: "service_images" },
        { model: ServiceType, as: "service_type" },
        {
          model: Bid,
          as: "bids",
          include: [
            {
              model: Expert,
              attributes: [
                "expert_id",
                "full_name",
                "email",
                "bio",
                "address",
                "is_verified",
              ],
            },
          ],
        },
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
