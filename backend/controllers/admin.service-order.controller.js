import ServiceOrder from "../models/service-order.model.js";
import Bid from "../models/bid.model.js";
import Expert from "../models/expert.model.js";
import RepairRequest from "../models/repair-request.model.js";
import Customer from "../models/customer.model.js";
import Payment from "../models/payment.model.js";
import { Op } from "sequelize";

// Get all service orders (admin view)
export const getAllServiceOrders = async (req, res, next) => {
  try {
    const serviceOrders = await ServiceOrder.findAll({
      include: [
        {
          model: Bid,
          include: [
            { model: Expert, attributes: ["expert_id", "full_name", "email"] },
            {
              model: RepairRequest,
              include: [
                {
                  model: Customer,
                  attributes: ["customer_id", "name", "phone", "address"],
                },
              ],
            },
          ],
        },
        { model: Payment },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      count: serviceOrders.length,
      data: serviceOrders,
    });
  } catch (error) {
    next(error);
  }
};

// Get service order by ID (admin view)
export const getServiceOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const serviceOrder = await ServiceOrder.findByPk(id, {
      include: [
        {
          model: Bid,
          include: [
            {
              model: Expert,
              attributes: ["expert_id", "full_name", "email", "address"],
            },
            {
              model: RepairRequest,
              include: [
                {
                  model: Customer,
                  attributes: ["customer_id", "name", "phone", "address"],
                },
              ],
            },
          ],
        },
        { model: Payment },
      ],
    });

    if (!serviceOrder) {
      return res.status(404).json({
        success: false,
        message: "Service order not found",
      });
    }

    res.status(200).json({
      success: true,
      data: serviceOrder,
    });
  } catch (error) {
    next(error);
  }
};

// Get service orders statistics for admin dashboard
export const getServiceOrderStats = async (req, res, next) => {
  try {
    // Get total count
    const totalOrders = await ServiceOrder.count();

    // Get count by status
    const inProgressCount = await ServiceOrder.count({
      where: { status: "in_progress" },
    });

    const completedCount = await ServiceOrder.count({
      where: { status: "completed" },
    });

    const deliveredCount = await ServiceOrder.count({
      where: { status: "delivered" },
    });

    // Get count by payment status
    const fullyPaidCount = await ServiceOrder.count({
      where: { payment_status: "fully_paid" },
    });

    const partiallyPaidCount = await ServiceOrder.count({
      where: { payment_status: "partially_paid" },
    });

    const unpaidCount = await ServiceOrder.count({
      where: { payment_status: "unpaid" },
    });

    // Get total revenue (sum of total_price for fully paid orders)
    const fullyPaidOrders = await ServiceOrder.findAll({
      where: { payment_status: "fully_paid" },
      attributes: ["total_price"],
    });

    const totalRevenue = fullyPaidOrders.reduce((sum, order) => {
      return sum + parseFloat(order.total_price || 0);
    }, 0);

    // Get recent service orders
    const recentOrders = await ServiceOrder.findAll({
      limit: 5,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Bid,
          include: [
            { model: Expert, attributes: ["full_name"] },
            {
              model: RepairRequest,
              include: [{ model: Customer, attributes: ["name"] }],
            },
          ],
        },
      ],
    });

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        byStatus: {
          inProgress: inProgressCount,
          completed: completedCount,
          delivered: deliveredCount,
        },
        byPaymentStatus: {
          fullyPaid: fullyPaidCount,
          partiallyPaid: partiallyPaidCount,
          unpaid: unpaidCount,
        },
        totalRevenue,
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update service order status (admin view)
export const updateServiceOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, completion_notes } = req.body;

    // Find the service order
    const serviceOrder = await ServiceOrder.findByPk(id);

    if (!serviceOrder) {
      return res.status(404).json({
        success: false,
        message: "Service order not found",
      });
    }

    // Validate the status transition
    const validStatuses = ["in_progress", "completed", "delivered", "refunded"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Must be one of: in_progress, completed, delivered, refunded",
      });
    }

    // Update the service order
    const updates = { status };
    if (completion_notes) {
      updates.completion_notes = completion_notes;
    }

    // Set completed_at timestamp if status is changing to completed
    if (status === "completed" && serviceOrder.status !== "completed") {
      updates.completed_at = new Date();
    }

    await serviceOrder.update(updates);

    res.status(200).json({
      success: true,
      message: `Service order status updated to ${status}`,
      data: await ServiceOrder.findByPk(id),
    });
  } catch (error) {
    next(error);
  }
};

// Update service order payment status (admin view)
export const updatePaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { payment_status } = req.body;

    // Find the service order
    const serviceOrder = await ServiceOrder.findByPk(id);

    if (!serviceOrder) {
      return res.status(404).json({
        success: false,
        message: "Service order not found",
      });
    }

    // Validate the payment status
    const validPaymentStatuses = [
      "unpaid",
      "partially_paid",
      "fully_paid",
      "refunded",
    ];
    if (!validPaymentStatuses.includes(payment_status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payment status. Must be one of: unpaid, partially_paid, fully_paid, refunded",
      });
    }

    // Update the service order
    await serviceOrder.update({ payment_status });

    res.status(200).json({
      success: true,
      message: `Service order payment status updated to ${payment_status}`,
      data: await ServiceOrder.findByPk(id),
    });
  } catch (error) {
    next(error);
  }
};
