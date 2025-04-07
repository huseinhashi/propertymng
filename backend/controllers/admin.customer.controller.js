import Customer from "../models/customer.model.js";

// Get all customers with optional search
export const getAllCustomers = async (req, res, next) => {
  try {
    const { search } = req.query;

    const query = search
      ? {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { phone: { [Op.like]: `%${search}%` } },
            { address: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    const customers = await Customer.findAll({ where: query });

    res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};

// Create a new customer
export const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, address, password } = req.body;

    const existingCustomer = await Customer.findOne({ where: { phone } });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: "Phone number already registered",
      });
    }

    const customer = await Customer.create({
      name,
      phone,
      address,
      password_hash: password, // Hashing should be implemented in the model or middleware
    });

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

// Update a customer
export const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, address, password } = req.body;

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (phone && phone !== customer.phone) {
      const existingCustomer = await Customer.findOne({ where: { phone } });
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: "Phone number already registered",
        });
      }
    }

    customer.name = name || customer.name;
    customer.phone = phone || customer.phone;
    customer.address = address || customer.address;
    if (password) {
      customer.password_hash = password; // Hashing should be implemented
    }

    await customer.save();

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a customer
export const deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    await customer.destroy();

    res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
