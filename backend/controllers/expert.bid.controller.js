import Bid from "../models/bid.model.js";
import Expert from "../models/expert.model.js";
import RepairRequest from "../models/repair-request.model.js";
import Customer from "../models/customer.model.js";
import ServiceType from "../models/service-type.model.js";
import ServiceImage from "../models/service-image.model.js";
import sequelize from "../database/db.js";
import { Op } from "sequelize";

// Get all bids for the authenticated expert
export const getMyBids = async (req, res, next) => {
  try {
    const expertId = req.user.expert_id;

    const bids = await Bid.findAll({
      where: { expert_id: expertId },
      include: [{ model: RepairRequest, include: ["service_type"] }],
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

// Get expert's bid for a specific repair request
export const getMyBidForRequest = async (req, res, next) => {
  try {
    const expertId = req.user.expert_id;
    const { requestId } = req.params;

    const bid = await Bid.findOne({
      where: {
        expert_id: expertId,
        request_id: requestId,
      },
      include: [{ model: RepairRequest }],
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

// Create a new bid by the expert
export const createBid = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const expertId = req.user.expert_id;
    const { request_id, cost, deadline, description } = req.body;

    // Validate required fields
    if (!request_id || !cost || !deadline) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Request ID, cost, and deadline are required",
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

    // Check if the expert has already placed a bid for this request
    const existingBid = await Bid.findOne({
      where: {
        expert_id: expertId,
        request_id,
      },
      transaction,
    });

    if (existingBid) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "You have already placed a bid for this repair request",
      });
    }

    // Create the bid
    const bid = await Bid.create(
      {
        request_id,
        expert_id: expertId,
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
      include: [{ model: RepairRequest }],
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

// Update expert's own bid
export const updateMyBid = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const expertId = req.user.expert_id;
    const { id } = req.params;
    const { cost, deadline, description } = req.body;

    // Find the bid
    const bid = await Bid.findOne({
      where: {
        bid_id: id,
        expert_id: expertId,
      },
      include: [{ model: RepairRequest }],
      transaction,
    });

    if (!bid) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Bid not found or you don't have permission to update it",
      });
    }

    // Check if the repair request is in bidding status
    if (bid.repair_request && bid.repair_request.status !== "bidding") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot update bids for requests with status "${bid.repair_request.status}". Request must be in "bidding" status.`,
      });
    }

    // Check if the bid is already accepted
    if (bid.is_accepted) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Cannot update an accepted bid",
      });
    }

    // Update fields
    if (cost !== undefined) bid.cost = cost;
    if (deadline !== undefined) bid.deadline = deadline;
    if (description !== undefined) bid.description = description;

    await bid.save({ transaction });
    await transaction.commit();

    // Fetch updated bid with associations
    const updatedBid = await Bid.findByPk(id, {
      include: [{ model: RepairRequest }],
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

// Delete expert's own bid
export const deleteMyBid = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const expertId = req.user.expert_id;
    const { id } = req.params;

    // Find the bid
    const bid = await Bid.findOne({
      where: {
        bid_id: id,
        expert_id: expertId,
      },
      include: [{ model: RepairRequest }],
      transaction,
    });

    if (!bid) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Bid not found or you don't have permission to delete it",
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

    // Check if the bid is already accepted
    if (bid.is_accepted) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Cannot delete an accepted bid",
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

// Get available repair requests for bidding
export const getAvailableRequests = async (req, res, next) => {
  try {
    const expertId = req.user.expert_id;

    // Get the expert's service types
    const expert = await Expert.findByPk(expertId, {
      include: [{ model: ServiceType }],
    });

    if (!expert) {
      return res.status(404).json({
        success: false,
        message: "Expert not found",
      });
    }

    // Extract the service type IDs the expert is qualified for
    const serviceTypeIds = expert.service_types.map(
      (type) => type.service_type_id
    );

    // Find repair requests that are in bidding status and match the expert's service types
    const availableRequests = await RepairRequest.findAll({
      where: {
        status: "bidding",
        service_type_id: { [Op.in]: serviceTypeIds },
      },
      include: [
        { model: Customer, attributes: ["name"] },
        { model: ServiceType },
        { model: ServiceImage },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Get the IDs of requests the expert has already bid on
    const expertBids = await Bid.findAll({
      where: { expert_id: expertId },
      attributes: ["request_id"],
    });

    const biddedRequestIds = expertBids.map((bid) => bid.request_id);

    // Filter out requests the expert has already bid on
    const unbiddedRequests = availableRequests.filter(
      (request) => !biddedRequestIds.includes(request.request_id)
    );

    res.status(200).json({
      success: true,
      count: unbiddedRequests.length,
      data: unbiddedRequests,
    });
  } catch (error) {
    next(error);
  }
};

// Get a specific repair request by ID for expert
export const getRequestById = async (req, res, next) => {
  try {
    const expertId = req.user.expert_id;
    const { id } = req.params;

    // Get the expert's service types
    const expert = await Expert.findByPk(expertId, {
      include: [{ model: ServiceType }],
    });

    if (!expert) {
      return res.status(404).json({
        success: false,
        message: "Expert not found",
      });
    }

    // Extract the service type IDs the expert is qualified for
    const serviceTypeIds = expert.service_types.map(
      (type) => type.service_type_id
    );

    // Find the specific repair request
    const repairRequest = await RepairRequest.findOne({
      where: {
        request_id: id,
        service_type_id: { [Op.in]: serviceTypeIds },
      },
      include: [
        {
          model: Customer,
          attributes: ["name"], // Only include customer name, exclude sensitive info
        },
        { model: ServiceType },
        { model: ServiceImage },
        {
          model: Bid,
          as: "bids",
          include: [
            {
              model: Expert,
              attributes: ["expert_id", "full_name", "is_verified"],
            },
          ],
        },
      ],
    });

    if (!repairRequest) {
      return res.status(404).json({
        success: false,
        message:
          "Repair request not found or you don't have permission to view it",
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
