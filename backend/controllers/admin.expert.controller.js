import Expert from "../models/expert.model.js";

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

    const experts = await Expert.findAll({ where: query });

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
    const { full_name, email, password, service_type_id, address } = req.body;

    const existingExpert = await Expert.findOne({ where: { email } });
    if (existingExpert) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const expert = await Expert.create({
      full_name,
      email,
      password_hash: password, // Hashing should be implemented
      service_type_id,
      address,
    });

    res.status(201).json({
      success: true,
      message: "Expert created successfully",
      data: expert,
    });
  } catch (error) {
    next(error);
  }
};

// Update an expert
export const updateExpert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, email, password, service_type_id, address } = req.body;

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

    expert.full_name = full_name || expert.full_name;
    expert.email = email || expert.email;
    expert.service_type_id = service_type_id || expert.service_type_id;
    expert.address = address || expert.address;
    if (password) {
      expert.password_hash = password; // Hashing should be implemented
    }

    await expert.save();

    res.status(200).json({
      success: true,
      message: "Expert updated successfully",
      data: expert,
    });
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
