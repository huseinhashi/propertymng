import Payout from "../models/payout.model.js";
import ServiceOrder from "../models/service-order.model.js";
import Expert from "../models/expert.model.js";
import Bid from "../models/bid.model.js";
import RepairRequest from "../models/repair-request.model.js";
import Customer from "../models/customer.model.js";
import { Op } from "sequelize";
import ServiceType from "../models/service-type.model.js";

// Admin: Get all payouts (with filters/search)
export const getAllPayouts = async (req, res, next) => {
  try {
    const { status, expert, order, search } = req.query;
    const where = {};
    if (status) where.payout_status = status;
    if (expert) where.expert_id = expert;
    if (order) where.service_order_id = order;
    if (search) {
      // Search by payout_id, order, expert name
      where[Op.or] = [{ payout_id: search }, { service_order_id: search }];
    }
    const payouts = await Payout.findAll({
      where,
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
                    { model: Customer, attributes: ["customer_id", "name"] },
                    {
                      model: ServiceType,
                    },
                  ],
                },
              ],
            },
          ],
        },
        { model: Expert, attributes: ["expert_id", "full_name", "email"] },
      ],
      order: [["createdAt", "DESC"]],
    });
    // Attach commission_percent from service type to each payout
    const result = payouts.map((payout) => {
      let commission_percent = null;
      try {
        commission_percent =
          payout.service_order?.bid?.repair_request?.service_type
            ?.commission_percent;
      } catch (e) {}
      return {
        ...payout.toJSON(),
        commission_percent,
      };
    });
    res.status(200).json({ success: true, count: result.length, data: result });
  } catch (error) {
    next(error);
  }
};

// Admin: Get payout by ID
export const getPayoutById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payout = await Payout.findByPk(id, {
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
                    { model: Customer, attributes: ["customer_id", "name"] },
                  ],
                },
              ],
            },
          ],
        },
        { model: Expert, attributes: ["expert_id", "full_name", "email"] },
      ],
    });
    if (!payout)
      return res
        .status(404)
        .json({ success: false, message: "Payout not found" });
    res.status(200).json({ success: true, data: payout });
  } catch (error) {
    next(error);
  }
};

// Admin: Update payout status (e.g., mark as released)
export const updatePayoutStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { payout_status } = req.body;
    const validStatuses = ["pending", "released"];
    if (!validStatuses.includes(payout_status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }
    const payout = await Payout.findByPk(id);
    if (!payout)
      return res
        .status(404)
        .json({ success: false, message: "Payout not found" });
    const updates = { payout_status };
    if (payout_status === "released") updates.released_at = new Date();
    await payout.update(updates);
    //also update the service order status to delivered
    await ServiceOrder.update(
      { status: "delivered" },
      { where: { service_order_id: payout.service_order_id } }
    );
    res.status(200).json({ success: true, data: payout });
  } catch (error) {
    next(error);
  }
};

// Expert: Get my payouts
export const getMyPayouts = async (req, res, next) => {
  try {
    const expertId = req.user.expert_id;
    const payouts = await Payout.findAll({
      where: { expert_id: expertId },
      include: [
        {
          model: ServiceOrder,
          include: [
            {
              model: Bid,
              include: [
                {
                  model: RepairRequest,
                  include: [
                    {
                      model: ServiceType,
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
    // Attach commission_percent from service type to each payout
    const result = payouts.map((payout) => {
      let commission_percent = null;
      try {
        commission_percent =
          payout.service_order?.bid?.repair_request?.service_type
            ?.commission_percent;
      } catch (e) {}
      return {
        ...payout.toJSON(),
        commission_percent,
      };
    });
    res.status(200).json({ success: true, count: result.length, data: result });
  } catch (error) {
    next(error);
  }
};

// Expert: Get my payout by ID
export const getMyPayoutById = async (req, res, next) => {
  try {
    const expertId = req.user.expert_id;
    const { id } = req.params;
    const payout = await Payout.findOne({
      where: { payout_id: id, expert_id: expertId },
      include: [{ model: ServiceOrder }],
    });
    if (!payout)
      return res
        .status(404)
        .json({ success: false, message: "Payout not found" });
    res.status(200).json({ success: true, data: payout });
  } catch (error) {
    next(error);
  }
};
