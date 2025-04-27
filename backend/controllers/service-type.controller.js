import ServiceType from "../models/service-type.model.js";
import ExpertServiceType from "../models/expert-service-type.model.js";
// Create a new service type (Admin only)
export const createServiceType = async (req, res, next) => {
  try {
    const { name, commission_percent } = req.body;

    if (!name || commission_percent == null) {
      return res.status(400).json({
        success: false,
        message: "Name and commission percent are required",
      });
    }

    const serviceType = await ServiceType.create({ name, commission_percent });

    res.status(201).json({
      success: true,
      message: "Service type created successfully",
      data: serviceType,
    });
  } catch (error) {
    next(error);
  }
};

// Get all service types (Public)
export const getAllServiceTypes = async (req, res, next) => {
  try {
    const serviceTypes = await ServiceType.findAll();

    res.status(200).json({
      success: true,
      data: serviceTypes,
    });
  } catch (error) {
    next(error);
  }
};

// Update a service type (Admin only)
export const updateServiceType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, commission_percent } = req.body;

    const serviceType = await ServiceType.findByPk(id);

    if (!serviceType) {
      return res.status(404).json({
        success: false,
        message: "Service type not found",
      });
    }

    serviceType.name = name || serviceType.name;
    serviceType.commission_percent =
      commission_percent != null
        ? commission_percent
        : serviceType.commission_percent;

    await serviceType.save();

    res.status(200).json({
      success: true,
      message: "Service type updated successfully",
      data: serviceType,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a service type (Admin only)
export const deleteServiceType = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Check if the service type is associated with any experts
    const isAssociated = await ExpertServiceType.findOne({
      where: { service_type_id: id },
    });

    if (isAssociated) {
      return res.status(400).json({
        success: false,
        message: "Service type is associated with experts",
      });
    }

    const serviceType = await ServiceType.findByPk(id);

    if (!serviceType) {
      return res.status(404).json({
        success: false,
        message: "Service type not found",
      });
    }

    await serviceType.destroy();

    res.status(200).json({
      success: true,
      message: "Service type deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
