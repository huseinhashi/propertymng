import RefundRequest from "../models/refund-request.model.js";
import ServiceOrder from "../models/service-order.model.js";
import { Op } from "sequelize";
import Payment from "../models/payment.model.js";
import Payout from "../models/payout.model.js";
import Notification from "../models/notification.model.js";

// Customer: Create refund request
export const createRefundRequest = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const customerId = req.user.customer_id;
    if (!customerId)
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    const order = await ServiceOrder.findByPk(orderId);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    // Only allow if customer owns the order
    // (Assume order has bid with repair_request with customer_id, or add join if needed)
    // Only allow if not already refunded
    const existing = await RefundRequest.findOne({
      where: {
        service_order_id: orderId,
        status: { [Op.in]: ["requested", "approved"] },
      },
    });
    if (existing)
      return res.status(400).json({
        success: false,
        message: "Refund already requested or processed",
      });
    const refund = await RefundRequest.create({
      service_order_id: orderId,
      amount: order.total_price,
      reason,
      status: "requested",
      customer_id: customerId,
    });
    if (refund && refund.service_order_id) {
      const order = await ServiceOrder.findByPk(refund.service_order_id);
      if (order) {
        await Notification.create({
          user_id: order.expert_id,
          user_type: "expert",
          title: "Refund Requested",
          message: `A refund has been requested for order #${order.service_order_id}.`,
        });
      }
    }
    res.status(201).json({ success: true, data: refund });
  } catch (error) {
    next(error);
  }
};

// Customer/Admin: Get refunds for a service order
export const getRefundRequestsForOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const refunds = await RefundRequest.findAll({
      where: { service_order_id: orderId },
    });
    res.status(200).json({ success: true, data: refunds });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all refund requests
export const getAllRefundRequests = async (req, res, next) => {
  try {
    const refunds = await RefundRequest.findAll();
    res.status(200).json({ success: true, data: refunds });
  } catch (error) {
    next(error);
  }
};

// Admin: Get refund request by id
export const getRefundRequestById = async (req, res, next) => {
  try {
    const { refundId } = req.params;
    const refund = await RefundRequest.findByPk(refundId);
    if (!refund)
      return res
        .status(404)
        .json({ success: false, message: "Refund not found" });
    res.status(200).json({ success: true, data: refund });
  } catch (error) {
    next(error);
  }
};

// Customer/Admin: Update refund request (allow updating reason/decision_notes at any time)
export const updateRefundRequest = async (req, res, next) => {
  try {
    const { refundId } = req.params;
    const { reason, decision_notes } = req.body;
    const refund = await RefundRequest.findByPk(refundId);
    if (!refund)
      return res
        .status(404)
        .json({ success: false, message: "Refund not found" });
    const updates = {};
    if (reason !== undefined) updates.reason = reason;
    if (decision_notes !== undefined) updates.decision_notes = decision_notes;
    await refund.update(updates);
    res.status(200).json({ success: true, data: refund });
  } catch (error) {
    next(error);
  }
};

// Customer: Delete refund request (if still requested)
export const deleteRefundRequest = async (req, res, next) => {
  try {
    const { refundId } = req.params;
    const refund = await RefundRequest.findByPk(refundId);
    if (!refund || refund.status !== "requested")
      return res
        .status(400)
        .json({ success: false, message: "Cannot delete this refund request" });
    await refund.destroy();
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// Admin: Update refund status (approve/reject) and handle side effects
export const adminUpdateRefundStatus = async (req, res, next) => {
  try {
    const { refundId } = req.params;
    const { status, decision_notes } = req.body;
    if (!["approved", "rejected"].includes(status))
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    const refund = await RefundRequest.findByPk(refundId);
    if (!refund)
      return res
        .status(404)
        .json({ success: false, message: "Refund not found" });
    await refund.update({ status, decision_notes, decided_at: new Date() });
    if (status === "approved") {
      // Refund all payments for this order
      await Payment.update(
        { status: "refunded" },
        { where: { service_order_id: refund.service_order_id } }
      );
      // Set service order status/payment_status to refunded
      const ServiceOrder = (await import("../models/service-order.model.js"))
        .default;
      await ServiceOrder.update(
        { status: "refunded", payment_status: "refunded" },
        { where: { service_order_id: refund.service_order_id } }
      );
      // Delete any payout for this order
      await Payout.destroy({
        where: { service_order_id: refund.service_order_id },
      });

      // Reopen the original repair request to bidding to accept new bids
      const RepairRequest = (await import("../models/repair-request.model.js"))
        .default;
      // Find the service order to get the associated repair_request_id
      const serviceOrder = await ServiceOrder.findOne({
        where: { service_order_id: refund.service_order_id },
      });
      if (serviceOrder && serviceOrder.bid_id) {
        // Get the bid to find the original repair request
        const bidModel = (await import("../models/bid.model.js")).default;
        const bid = await bidModel.findOne({
          where: { bid_id: serviceOrder.bid_id },
        });
        if (bid && bid.request_id) {
          await RepairRequest.update(
            { status: "bidding" },
            { where: { request_id: bid.request_id } }
          );
          // Unaccept the original bid
          await bid.update({ is_accepted: false });
        }
      }
    }
    if (refund && refund.service_order_id) {
      const order = await ServiceOrder.findByPk(refund.service_order_id);
      if (order) {
        await Notification.create({
          user_id: order.customer_id,
          user_type: "customer",
          title: `Refund ${
            refund.status === "approved" ? "Approved" : "Rejected"
          }`,
          message: `Your refund request for order #${order.service_order_id} has been ${refund.status}.`,
        });
        await Notification.create({
          user_id: order.expert_id,
          user_type: "expert",
          title: `Refund ${
            refund.status === "approved" ? "Approved" : "Rejected"
          }`,
          message: `Refund request for order #${order.service_order_id} has been ${refund.status}.`,
        });
      }
    }
    res.status(200).json({ success: true, data: refund });
  } catch (error) {
    next(error);
  }
};
