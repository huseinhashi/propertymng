import Bid from "../models/bid.model.js";
import RepairRequest from "../models/repair-request.model.js";
import ServiceOrder from "../models/service-order.model.js";
import Payment from "../models/payment.model.js";
import sequelize from "../database/db.js";
import { Op } from "sequelize";

// Accept a bid (customer action)
export const acceptBid = async (req, res, next) => {
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

    // Find the bid
    const bid = await Bid.findByPk(id, {
      include: [{ model: RepairRequest }],
      transaction,
    });

    if (!bid) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      });
    }

    // Check if the repair request exists and belongs to the customer
    const repairRequest = bid.repair_request;
    if (!repairRequest) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Associated repair request not found",
      });
    }

    // Verify this repair request belongs to the authenticated customer
    if (repairRequest.customer_id !== customerId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "You can only accept bids for your own repair requests",
      });
    }

    // Check if the repair request is in bidding status
    if (repairRequest.status !== "bidding") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot accept bids for requests with status "${repairRequest.status}". Request must be in "bidding" status.`,
      });
    }

    // Update bid to accepted status
    bid.is_accepted = true;
    await bid.save({ transaction });

    // Update other bids for this request to not accepted
    await Bid.update(
      { is_accepted: false },
      {
        where: {
          request_id: bid.request_id,
          bid_id: { [Op.ne]: bid.bid_id },
        },
        transaction,
      }
    );

    // Update repair request status to in_progress
    repairRequest.status = "closed";
    await repairRequest.save({ transaction });

    // Create a new service order
    const serviceOrder = await ServiceOrder.create(
      {
        bid_id: bid.bid_id,
        base_price: bid.cost,
        total_price: bid.cost,
        status: "in_progress",
        payment_status: "unpaid", // Initially set as unpaid

        deadline: bid.deadline,
      },
      { transaction }
    );

    // Create an initial payment record with pending status
    const payment = await Payment.create(
      {
        service_order_id: serviceOrder.service_order_id,
        type: "initial",
        amount: bid.cost,
        status: "pending",
        reason: "Initial payment for service",
      },
      { transaction }
    );

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Bid accepted and service order created successfully",
      data: {
        bid_id: bid.bid_id,
        request_id: repairRequest.request_id,
        status: repairRequest.status,
        service_order: {
          id: serviceOrder.service_order_id,
          payment_status: serviceOrder.payment_status,
        },
        payment: {
          id: payment.payment_id,
          amount: payment.amount,
          status: payment.status,
        },
      },
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};
