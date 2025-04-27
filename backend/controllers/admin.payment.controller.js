import Payment from "../models/payment.model.js";
import ServiceOrder from "../models/service-order.model.js";
import Bid from "../models/bid.model.js";
import Expert from "../models/expert.model.js";
import RepairRequest from "../models/repair-request.model.js";
import Customer from "../models/customer.model.js";
import { Op } from "sequelize";
import sequelize from "../database/db.js";

// Get all payments (admin view)
export const getAllPayments = async (req, res, next) => {
  try {
    const payments = await Payment.findAll({
      include: [
        {
          model: ServiceOrder,
          include: [
            {
              model: Bid,
              include: [
                { model: Expert, attributes: ["expert_id", "full_name"] },
                {
                  model: RepairRequest,
                  include: [
                    {
                      model: Customer,
                      attributes: ["customer_id", "name"],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

// Get payment by ID (admin view)
export const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findByPk(id, {
      include: [
        {
          model: ServiceOrder,
          include: [
            {
              model: Bid,
              include: [
                { model: Expert },
                {
                  model: RepairRequest,
                  include: [{ model: Customer }],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

// Update payment status (admin view)
export const updatePaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Find the payment
    const payment = await Payment.findByPk(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Validate status
    const validStatuses = ["pending", "paid", "refunded", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Must be one of: pending, paid, refunded, cancelled",
      });
    }

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      // Update payment
      const updates = { status };

      // If marking as paid, set paid_at timestamp
      if (status === "paid" && payment.status !== "paid") {
        updates.paid_at = new Date();
        updates.transaction_ref = `ADMIN-${Date.now()}`;
      }

      await payment.update(updates, { transaction });

      // If marking as paid, update service order payment status
      if (status === "paid") {
        const serviceOrder = await ServiceOrder.findByPk(
          payment.service_order_id,
          { transaction }
        );

        if (serviceOrder) {
          // Get all payments for this service order
          const allPayments = await Payment.findAll({
            where: { service_order_id: payment.service_order_id },
            transaction,
          });

          // Calculate total paid amount
          const totalPaidAmount = allPayments
            .filter(
              (p) =>
                p.status === "paid" ||
                (p.payment_id === payment.payment_id && status === "paid")
            )
            .reduce((sum, p) => sum + parseFloat(p.amount), 0);

          // Calculate total price
          const totalPrice = parseFloat(serviceOrder.total_price);

          // Update service order payment status based on paid amount
          let paymentStatus;
          if (totalPaidAmount >= totalPrice) {
            paymentStatus = "fully_paid";
          } else if (totalPaidAmount > 0) {
            paymentStatus = "partially_paid";
          } else {
            paymentStatus = "unpaid";
          }

          await serviceOrder.update(
            { payment_status: paymentStatus },
            { transaction }
          );
        }
      }

      // Commit transaction
      await transaction.commit();

      res.status(200).json({
        success: true,
        message: `Payment status updated to ${status}`,
        data: await Payment.findByPk(id),
      });
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// Get payment statistics
export const getPaymentStats = async (req, res, next) => {
  try {
    // Get total counts
    const totalPayments = await Payment.count();

    // Get counts by status
    const pendingCount = await Payment.count({ where: { status: "pending" } });
    const paidCount = await Payment.count({ where: { status: "paid" } });
    const refundedCount = await Payment.count({
      where: { status: "refunded" },
    });
    const cancelledCount = await Payment.count({
      where: { status: "cancelled" },
    });

    // Get counts by type
    const initialCount = await Payment.count({ where: { type: "initial" } });
    const extraCount = await Payment.count({ where: { type: "extra" } });
    const refundCount = await Payment.count({ where: { type: "refund" } });

    // Calculate total processed amount (paid payments)
    const paidPayments = await Payment.findAll({
      where: { status: "paid" },
      attributes: ["amount"],
    });

    const totalProcessedAmount = paidPayments.reduce((sum, payment) => {
      return sum + parseFloat(payment.amount || 0);
    }, 0);

    // Get recent payments
    const recentPayments = await Payment.findAll({
      limit: 5,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: ServiceOrder,
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
        },
      ],
    });

    res.status(200).json({
      success: true,
      data: {
        totalPayments,
        byStatus: {
          pending: pendingCount,
          paid: paidCount,
          refunded: refundedCount,
          cancelled: cancelledCount,
        },
        byType: {
          initial: initialCount,
          extra: extraCount,
          refund: refundCount,
        },
        totalProcessedAmount,
        recentPayments,
      },
    });
  } catch (error) {
    next(error);
  }
};
