import Bid from "../models/bid.model.js";
import Expert from "../models/expert.model.js";
import RepairRequest from "../models/repair-request.model.js";
import sequelize from "../database/db.js";
import { Op } from "sequelize";

// Get all bids
export const getAllBids = async (req, res, next) => {
  try {
    const bids = await Bid.findAll({
      include: [
        { model: Expert, attributes: ["expert_id", "full_name", "email"] },
        {
          model: RepairRequest,
          attributes: ["request_id", "description", "status"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      count: bids.length,
      data: bids,
    });
  } catch (error) {
    next(error);
  }
};

// Get bids for a specific repair request
export const getBidsByRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;

    // Check if repair request exists
    const repairRequest = await RepairRequest.findByPk(requestId);
    if (!repairRequest) {
      return res.status(404).json({
        success: false,
        message: "Repair request not found",
      });
    }

    const bids = await Bid.findAll({
      where: { request_id: requestId },
      include: [
        { model: Expert, attributes: ["expert_id", "full_name", "email"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      count: bids.length,
      data: bids,
    });
  } catch (error) {
    next(error);
  }
};

// Get a specific bid by ID
export const getBidById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const bid = await Bid.findByPk(id, {
      include: [
        { model: Expert, attributes: ["expert_id", "full_name", "email"] },
        { model: RepairRequest },
      ],
    });

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      });
    }

    res.status(200).json({
      success: true,
      data: bid,
    });
  } catch (error) {
    next(error);
  }
};

// Accept a bid (admin action)
export const acceptBid = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

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

    // Check if the repair request exists and is in bidding status
    const repairRequest = bid.repair_request;
    if (!repairRequest) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Associated repair request not found",
      });
    }

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

    // Update repair request status to closed
    repairRequest.status = "closed";
    await repairRequest.save({ transaction });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Bid accepted successfully",
      data: bid,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Create a new bid (admin can create on behalf of expert)
export const createBid = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { request_id, expert_id, cost, deadline, description } = req.body;

    // Validate required fields
    if (!request_id || !expert_id || !cost || !deadline) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Request ID, expert ID, cost, and deadline are required",
      });
    }

    // Check if expert exists
    const expert = await Expert.findByPk(expert_id, { transaction });
    if (!expert) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Expert not found",
      });
    }

    // Check if repair request exists
    const repairRequest = await RepairRequest.findByPk(request_id, {
      transaction,
    });
    if (!repairRequest) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Repair request not found",
      });
    }

    // Check if repair request is in bidding status
    if (repairRequest.status !== "bidding") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot create bids for requests with status "${repairRequest.status}". Request must be in "bidding" status.`,
      });
    }

    // Create the bid
    const bid = await Bid.create(
      {
        request_id,
        expert_id,
        cost,
        deadline,
        description: description || "",
        is_accepted: false,
      },
      { transaction }
    );

    await transaction.commit();

    // Fetch complete bid with associations
    const completeBid = await Bid.findByPk(bid.bid_id, {
      include: [
        { model: Expert, attributes: ["expert_id", "full_name", "email"] },
        { model: RepairRequest },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Bid created successfully",
      data: completeBid,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Update a bid
export const updateBid = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { cost, deadline, description, is_accepted } = req.body;

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

    // Check if the repair request is in bidding status unless we're accepting the bid
    if (
      bid.repair_request &&
      bid.repair_request.status !== "bidding" &&
      !is_accepted
    ) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot update bids for requests with status "${bid.repair_request.status}". Request must be in "bidding" status.`,
      });
    }

    // Update fields
    if (cost !== undefined) bid.cost = cost;
    if (deadline !== undefined) bid.deadline = deadline;
    if (description !== undefined) bid.description = description;

    // If we're accepting the bid, handle all the related updates
    if (is_accepted === true && !bid.is_accepted) {
      bid.is_accepted = true;

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

      // Update repair request status to closed
      if (bid.repair_request) {
        bid.repair_request.status = "closed";
        await bid.repair_request.save({ transaction });
      }
    }

    await bid.save({ transaction });
    await transaction.commit();

    // Fetch updated bid with associations
    const updatedBid = await Bid.findByPk(id, {
      include: [
        { model: Expert, attributes: ["expert_id", "full_name", "email"] },
        { model: RepairRequest },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Bid updated successfully",
      data: updatedBid,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Delete a bid
export const deleteBid = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

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

    // Check if the repair request is in bidding status
    if (bid.repair_request && bid.repair_request.status !== "bidding") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot delete bids for requests with status "${bid.repair_request.status}". Request must be in "bidding" status.`,
      });
    }

    // Delete the bid
    await bid.destroy({ transaction });
    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Bid deleted successfully",
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Get all bids by expert
export const getBidsByExpert = async (req, res, next) => {
  try {
    const { expertId } = req.params;

    // Check if expert exists
    const expert = await Expert.findByPk(expertId);
    if (!expert) {
      return res.status(404).json({
        success: false,
        message: "Expert not found",
      });
    }

    const bids = await Bid.findAll({
      where: { expert_id: expertId },
      include: [{ model: RepairRequest }],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      count: bids.length,
      data: bids,
    });
  } catch (error) {
    next(error);
  }
};
