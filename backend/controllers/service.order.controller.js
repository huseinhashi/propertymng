import sequelize from "../database/db.js";
import Bid from "../models/bid.model.js";
import Expert from "../models/expert.model.js";
import ServiceOrder from "../models/service-order.model.js";
import Payment from "../models/payment.model.js";
import RepairRequest from "../models/repair-request.model.js";
import Customer from "../models/customer.model.js";
import { Op } from "sequelize";
import { initiateWaafiPayment } from "../services/payment.service.js";
import Payout from "../models/payout.model.js";
import ServiceType from "../models/service-type.model.js";
import Notification from "../models/notification.model.js";

// Get all service orders for the customer
export const getCustomerServiceOrders = async (req, res, next) => {
  try {
    const customerId = req.user.customer_id;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Find all repair requests for this customer
    const repairRequests = await RepairRequest.findAll({
      where: { customer_id: customerId },
      attributes: ["request_id"],
    });

    const requestIds = repairRequests.map((request) => request.request_id);

    // Find bids associated with these repair requests that were accepted
    const acceptedBids = await Bid.findAll({
      where: {
        request_id: { [Op.in]: requestIds },
        is_accepted: true,
      },
      attributes: ["bid_id"],
    });

    const bidIds = acceptedBids.map((bid) => bid.bid_id);

    // Find service orders associated with these bids
    const serviceOrders = await ServiceOrder.findAll({
      where: {
        bid_id: { [Op.in]: bidIds },
      },
      include: [
        {
          model: Bid,
          include: [
            { model: Expert, attributes: ["full_name", "email"] },
            { model: RepairRequest, attributes: ["description", "location"] },
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

// Get all service orders for the expert
export const getExpertServiceOrders = async (req, res, next) => {
  try {
    const expertId = req.user.expert_id;

    if (!expertId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Find all bids for this expert that were accepted
    const acceptedBids = await Bid.findAll({
      where: {
        expert_id: expertId,
        is_accepted: true,
      },
      attributes: ["bid_id"],
    });

    const bidIds = acceptedBids.map((bid) => bid.bid_id);

    // Find service orders associated with these bids
    const serviceOrders = await ServiceOrder.findAll({
      where: {
        bid_id: { [Op.in]: bidIds },
      },
      include: [
        {
          model: Bid,
          include: [
            {
              model: RepairRequest,
              include: [
                { model: Customer, attributes: ["name", "phone", "address"] },
              ],
            },
          ],
        },
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

// Get a specific service order by ID
export const getServiceOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.customer_id || req.user.expert_id;
    const userType = req.user.customer_id ? "customer" : "expert";

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Find the service order with all related data
    const serviceOrder = await ServiceOrder.findByPk(id, {
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
    });

    if (!serviceOrder) {
      return res.status(404).json({
        success: false,
        message: "Service order not found",
      });
    }

    // Verify that the user has permission to view this service order
    const hasPermission =
      userType === "customer"
        ? serviceOrder.bid.repair_request.customer.customer_id === userId
        : serviceOrder.bid.expert_id === userId;

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view this service order",
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

// Process payment for a service order
export const processPayment = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const customerId = req.user.customer_id;

    if (!customerId) {
      await transaction.rollback();
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Find the service order
    const serviceOrder = await ServiceOrder.findOne({
      where: { service_order_id: id },
      include: [
        {
          model: Bid,
          include: [
            {
              model: RepairRequest,
              include: [{ model: Customer }],
            },
          ],
        },
        {
          model: Payment,
          where: { status: "pending" },
        },
      ],
      transaction,
    });

    if (!serviceOrder) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Service order not found or no pending payments",
      });
    }

    // Verify this service order belongs to the authenticated customer
    if (serviceOrder.bid.repair_request.customer.customer_id !== customerId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "You can only process payments for your own service orders",
      });
    }
    //check if the service is already completed or refunded or delivred
    if (
      serviceOrder.status === "completed" ||
      serviceOrder.status === "refunded" ||
      serviceOrder.status === "delivered"
    ) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Service order already completed, refunded, or delivered",
      });
    }

    // Update all pending payments to paid
    await Payment.update(
      {
        status: "paid",
        paid_at: new Date(),
      },
      {
        where: {
          service_order_id: id,
          status: "pending",
        },
        transaction,
      }
    );

    // Calculate if all payments are completed
    const allPayments = await Payment.findAll({
      where: { service_order_id: id },
      transaction,
    });

    const totalPaid = allPayments
      .filter((payment) => payment.status === "paid")
      .reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);

    // Update service order payment status based on paid amount vs total price
    if (totalPaid >= parseFloat(serviceOrder.total_price || 0)) {
      await serviceOrder.update(
        { payment_status: "fully_paid" },
        { transaction }
      );
    } else if (totalPaid > 0) {
      await serviceOrder.update(
        { payment_status: "partially_paid" },
        { transaction }
      );
    }

    await transaction.commit();

    // Fetch the updated service order
    const updatedServiceOrder = await ServiceOrder.findByPk(id, {
      include: [{ model: Payment }],
    });

    res.status(200).json({
      success: true,
      message: "Payment processed successfully",
      data: updatedServiceOrder,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// PATCH /customer/service-orders/:id/deliver
export const markOrderAsDelivered = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const customerId = req.user.customer_id;

    if (!customerId) {
      await transaction.rollback();
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    // Find the service order
    const serviceOrder = await ServiceOrder.findOne({
      where: { service_order_id: id },
      include: [{ model: Bid, include: [{ model: RepairRequest }] }],
      transaction,
    });

    if (!serviceOrder) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Service order not found" });
    }

    // Only allow if status is completed and customer owns the order
    if (
      serviceOrder.status !== "completed" ||
      serviceOrder.bid.repair_request.customer_id !== customerId
    ) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Order not eligible for delivery confirmation",
      });
    }

    // Update status to delivered
    await serviceOrder.update({ status: "delivered" }, { transaction });

    // Update payout to released if exists
    const payout = await Payout.findOne({
      where: { service_order_id: id },
      transaction,
    });
    if (payout && payout.payout_status !== "released") {
      await payout.update(
        { payout_status: "released", released_at: new Date() },
        { transaction }
      );
    }

    await transaction.commit();
    res
      .status(200)
      .json({ success: true, message: "Order marked as delivered" });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Update service order status (for experts)
export const updateServiceOrderStatus = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { status, completion_notes } = req.body;
    const expertId = req.user.expert_id;

    if (!expertId) {
      await transaction.rollback();
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Find the service order
    const serviceOrder = await ServiceOrder.findOne({
      where: { service_order_id: id },
      include: [{ model: Bid }],
      transaction,
    });

    if (!serviceOrder) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Service order not found",
      });
    }

    // Verify this service order belongs to the authenticated expert
    if (serviceOrder.bid.expert_id !== expertId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "You can only update status for your own service orders",
      });
    }

    // Validate the status transition
    const validStatuses = ["in_progress", "completed", "delivered"];
    if (!validStatuses.includes(status)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Must be one of: in_progress, completed, delivered",
      });
    }

    // Prevent transitioning back to in_progress after completion
    if (serviceOrder.status === "completed" && status === "in_progress") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Cannot change status from completed back to in_progress",
      });
    }

    // Prevent transitioning to completed if payment isn't fully paid
    if (
      status === "completed" &&
      serviceOrder.payment_status !== "fully_paid"
    ) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Cannot mark as completed until customer has fully paid",
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

      // Calculate payout
      const allPayments = await Payment.findAll({
        where: { service_order_id: id, status: { [Op.in]: ["paid"] } },
        transaction,
      });
      console.log("allPayments", allPayments);
      const totalPayment = allPayments.reduce(
        (sum, p) => sum + parseFloat(p.amount || 0),
        0
      );
      console.log("totalPayment", totalPayment);

      // Get commission percent from service type
      const bid = await Bid.findByPk(serviceOrder.bid_id, {
        include: [{ model: RepairRequest }],
        transaction,
      });
      console.log("bid", bid);
      const serviceTypeId = bid.repair_request.service_type_id;
      const serviceType = await ServiceType.findByPk(serviceTypeId, {
        transaction,
      });
      console.log("serviceType", serviceType);
      const commissionPercent = parseFloat(serviceType.commission_percent || 0);
      console.log("commissionPercent", commissionPercent);
      const commission = (totalPayment * commissionPercent) / 100;
      console.log("commission", commission);
      const netPayout = totalPayment - commission;
      const expertId = bid.expert_id;
      console.log("netPayout", netPayout);
      console.log("expertId", expertId);

      // Create or update payout
      const [payout, created] = await Payout.findOrCreate({
        where: { service_order_id: id },
        defaults: {
          expert_id: expertId,
          total_payment: totalPayment,
          commission,
          net_payout: netPayout,
          payout_status: "pending",
        },
        transaction,
      });
      console.log("payout", payout);
      console.log("created", created);
      if (!created) {
        await payout.update(
          {
            expert_id: expertId,
            total_payment: totalPayment,
            commission,
            net_payout: netPayout,
            payout_status: "pending",
          },
          { transaction }
        );
      }
    }

    await serviceOrder.update(updates, { transaction });
    await transaction.commit();

    res.status(200).json({
      success: true,
      message: `Service order status updated to ${status}`,
      data: await ServiceOrder.findByPk(id),
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Request additional payment (for experts)
export const requestAdditionalPayment = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { amount, reason } = req.body;
    const expertId = req.user.expert_id;

    if (!expertId) {
      await transaction.rollback();
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Validate required fields
    if (!amount || !reason) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Amount and reason are required",
      });
    }

    // Find the service order
    const serviceOrder = await ServiceOrder.findOne({
      where: { service_order_id: id },
      include: [{ model: Bid }],
      transaction,
    });

    if (!serviceOrder) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Service order not found",
      });
    }
    //check if the service is already completed or refunded or delivred
    if (
      serviceOrder.status === "completed" ||
      serviceOrder.status === "refunded" ||
      serviceOrder.status === "delivered"
    ) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Service order already completed, refunded, or delivered",
      });
    }
    // Verify this service order belongs to the authenticated expert
    if (serviceOrder.bid.expert_id !== expertId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message:
          "You can only request additional payment for your own service orders",
      });
    }

    // Prevent requesting additional payment if service is already completed or delivered
    if (
      serviceOrder.status === "completed" ||
      serviceOrder.status === "delivered"
    ) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot request additional payment for service orders with status "${serviceOrder.status}"`,
      });
    }

    // Create a new payment record
    const payment = await Payment.create(
      {
        service_order_id: id,
        type: "extra",
        amount,
        reason,
        status: "pending",
      },
      { transaction }
    );

    // Update service order with the additional amount also update the payment status to partially paid
    const newExtraPrice =
      parseFloat(serviceOrder.extra_price || 0) + parseFloat(amount);
    const newTotalPrice = parseFloat(serviceOrder.base_price) + newExtraPrice;

    await serviceOrder.update(
      {
        extra_price: newExtraPrice,
        total_price: newTotalPrice,
        payment_status: "partially_paid",
      },
      { transaction }
    );

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Additional payment requested successfully",
      data: {
        payment,
        serviceOrder: await ServiceOrder.findByPk(id),
      },
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Process a single payment by payment ID
export const processPaymentById = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { paymentId } = req.params;
    const customerId = req.user.customer_id;

    if (!customerId) {
      await transaction.rollback();
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Find the payment
    const payment = await Payment.findOne({
      where: { payment_id: paymentId, status: "pending" },
      transaction,
    });

    if (!payment) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Payment not found or not pending",
      });
    }

    // Find the service order and customer details
    const serviceOrder = await ServiceOrder.findOne({
      where: { service_order_id: payment.service_order_id },
      include: [
        {
          model: Bid,
          include: [
            {
              model: RepairRequest,
              include: [{ model: Customer }],
            },
          ],
        },
      ],
      transaction,
    });

    if (!serviceOrder) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Service order not found",
      });
    }

    // Verify this service order belongs to the authenticated customer
    if (serviceOrder.bid.repair_request.customer.customer_id !== customerId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "You can only process payments for your own service orders",
      });
    }

    //check if the service is already completed or refunded or delivred
    if (
      serviceOrder.status === "completed" ||
      serviceOrder.status === "refunded" ||
      serviceOrder.status === "delivered"
    ) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Service order already completed, refunded, or delivered",
      });
    }
    // Get customer phone number for payment
    const customerPhone = serviceOrder.bid.repair_request.customer.phone;

    if (!customerPhone) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Customer phone number is required for payment processing",
      });
    }

    // Process payment with Waafi
    try {
      const paymentResult = await initiateWaafiPayment(
        customerPhone,
        parseFloat(payment.amount),
        payment.payment_id
      );

      if (!paymentResult.success) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Payment processing failed",
          details: paymentResult.data,
        });
      }

      // Update payment record
      await payment.update(
        {
          status: "paid",
          paid_at: new Date(),
          transaction_ref: paymentResult.referenceId,
        },
        { transaction }
      );
    } catch (paymentError) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Payment processing failed: ${paymentError.message}`,
      });
    }

    // Calculate if all payments are completed
    const allPayments = await Payment.findAll({
      where: { service_order_id: payment.service_order_id },
      transaction,
    });

    const totalPaid = allPayments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    const hasPendingPayments = allPayments.some((p) => p.status === "pending");

    // Update service order payment status
    let newPaymentStatus;
    if (!hasPendingPayments) {
      newPaymentStatus = "fully_paid";
    } else if (totalPaid > 0) {
      newPaymentStatus = "partially_paid";
    } else {
      newPaymentStatus = "unpaid";
    }

    await serviceOrder.update(
      { payment_status: newPaymentStatus },
      { transaction }
    );

    await transaction.commit();

    // Fetch the updated payment with service order
    const updatedPayment = await Payment.findByPk(paymentId, {
      include: [
        {
          model: ServiceOrder,
          include: [
            {
              model: Bid,
              include: [
                { model: Expert, attributes: ["full_name"] },
                { model: RepairRequest, attributes: ["description"] },
              ],
            },
          ],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Payment processed successfully",
      data: updatedPayment,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Update an additional payment (for experts)
export const updateAdditionalPayment = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { orderId, paymentId } = req.params;
    const { amount, reason } = req.body;
    const expertId = req.user.expert_id;

    if (!expertId) {
      await transaction.rollback();
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Find the payment
    const payment = await Payment.findOne({
      where: {
        payment_id: paymentId,
        service_order_id: orderId,
        type: "extra",
        status: "pending",
      },
      transaction,
    });

    if (!payment) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Pending additional payment not found",
      });
    }

    // Find the service order and verify expert ownership
    const serviceOrder = await ServiceOrder.findOne({
      where: { service_order_id: orderId },
      include: [{ model: Bid }],
      transaction,
    });
    //check if the service is already completed or refunded or delivred
    if (
      serviceOrder.status === "completed" ||
      serviceOrder.status === "refunded" ||
      serviceOrder.status === "delivered"
    ) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Service order already completed, refunded, or delivered",
      });
    }

    if (!serviceOrder || serviceOrder.bid.expert_id !== expertId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message:
          "You can only update additional payments for your own service orders",
      });
    }

    // Validate input
    if (!amount || isNaN(amount) || amount <= 0 || !reason) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Valid amount and reason are required",
      });
    }

    // Update payment
    await payment.update({ amount, reason }, { transaction });

    // Recalculate extra_price and total_price for the service order
    const extraPayments = await Payment.findAll({
      where: {
        service_order_id: orderId,
        type: "extra",
        status: "pending",
      },
      transaction,
    });
    const paidExtraPayments = await Payment.findAll({
      where: {
        service_order_id: orderId,
        type: "extra",
        status: "paid",
      },
      transaction,
    });
    const totalExtra = [...extraPayments, ...paidExtraPayments].reduce(
      (sum, p) => sum + parseFloat(p.amount || 0),
      0
    );
    const newTotalPrice = parseFloat(serviceOrder.base_price) + totalExtra;
    await serviceOrder.update(
      {
        extra_price: totalExtra,
        total_price: newTotalPrice,
      },
      { transaction }
    );

    // Recalculate payment_status
    const allPayments = await Payment.findAll({
      where: { service_order_id: orderId },
      transaction,
    });
    const totalPaid = allPayments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const hasPendingPayments = allPayments.some((p) => p.status === "pending");
    let newPaymentStatus;
    if (!hasPendingPayments && totalPaid >= newTotalPrice) {
      newPaymentStatus = "fully_paid";
    } else if (totalPaid > 0) {
      newPaymentStatus = "partially_paid";
    } else {
      newPaymentStatus = "unpaid";
    }
    await serviceOrder.update(
      { payment_status: newPaymentStatus },
      { transaction }
    );

    await transaction.commit();
    res.status(200).json({
      success: true,
      message: "Additional payment updated successfully",
      data: await Payment.findByPk(paymentId),
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Delete an additional payment (for experts)
export const deleteAdditionalPayment = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { orderId, paymentId } = req.params;
    const expertId = req.user.expert_id;

    if (!expertId) {
      await transaction.rollback();
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Find the payment
    const payment = await Payment.findOne({
      where: {
        payment_id: paymentId,
        service_order_id: orderId,
        type: "extra",
        status: "pending",
      },
      transaction,
    });

    if (!payment) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Pending additional payment not found",
      });
    }

    // Find the service order and verify expert ownership
    const serviceOrder = await ServiceOrder.findOne({
      where: { service_order_id: orderId },
      include: [{ model: Bid }],
      transaction,
    });

    if (!serviceOrder || serviceOrder.bid.expert_id !== expertId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message:
          "You can only delete additional payments for your own service orders",
      });
    }
    //check if the service is already completed or refunded or delivred
    if (
      serviceOrder.status === "completed" ||
      serviceOrder.status === "refunded" ||
      serviceOrder.status === "delivered"
    ) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Service order already completed, refunded, or delivered",
      });
    }

    // Delete payment
    await payment.destroy({ transaction });

    // Recalculate extra_price and total_price for the service order
    const extraPayments = await Payment.findAll({
      where: {
        service_order_id: orderId,
        type: "extra",
        status: "pending",
      },
      transaction,
    });
    const paidExtraPayments = await Payment.findAll({
      where: {
        service_order_id: orderId,
        type: "extra",
        status: "paid",
      },
      transaction,
    });
    const totalExtra = [...extraPayments, ...paidExtraPayments].reduce(
      (sum, p) => sum + parseFloat(p.amount || 0),
      0
    );
    const newTotalPrice = parseFloat(serviceOrder.base_price) + totalExtra;
    await serviceOrder.update(
      {
        extra_price: totalExtra,
        total_price: newTotalPrice,
      },
      { transaction }
    );

    // Recalculate payment_status
    const allPayments = await Payment.findAll({
      where: { service_order_id: orderId },
      transaction,
    });
    const totalPaid = allPayments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const hasPendingPayments = allPayments.some((p) => p.status === "pending");
    let newPaymentStatus;
    if (!hasPendingPayments && totalPaid >= newTotalPrice) {
      newPaymentStatus = "fully_paid";
    } else if (totalPaid > 0) {
      newPaymentStatus = "partially_paid";
    } else {
      newPaymentStatus = "unpaid";
    }
    await serviceOrder.update(
      { payment_status: newPaymentStatus },
      { transaction }
    );

    await transaction.commit();
    res.status(200).json({
      success: true,
      message: "Additional payment deleted successfully",
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Add a controller to mark a notification as read
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByPk(id);
    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }
    await notification.update({ is_read: true });
    res.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    next(error);
  }
};
