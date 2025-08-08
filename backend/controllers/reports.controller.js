import { Op } from "sequelize";
import sequelize from "../database/db.js";
import ServiceOrder from "../models/service-order.model.js";
import RepairRequest from "../models/repair-request.model.js";
import Payment from "../models/payment.model.js";
import Payout from "../models/payout.model.js";
import Customer from "../models/customer.model.js";
import Expert from "../models/expert.model.js";
import Bid from "../models/bid.model.js";
import RefundRequest from "../models/refund-request.model.js";

// Helper function to get date range based on filter
const getDateRange = (dateFilter, customStartDate, customEndDate) => {
  const now = new Date();
  let startDate, endDate;

  switch (dateFilter) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      break;
    case "this_month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    case "this_year":
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear() + 1, 0, 1);
      break;
    case "custom":
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
      break;
    default: // all_time
      startDate = new Date(0);
      endDate = new Date();
      break;
  }

  return { startDate, endDate };
};

// Service Orders Report
export const getServiceOrdersReport = async (req, res, next) => {
  try {
    const { dateFilter, customStartDate, customEndDate, status } = req.query;
    const { startDate, endDate } = getDateRange(dateFilter, customStartDate, customEndDate);

    const whereClause = {
      createdAt: {
        [Op.between]: [startDate, endDate],
      },
    };

    if (status && status !== "all") {
      whereClause.status = status;
    }

    const serviceOrders = await ServiceOrder.findAll({
      where: whereClause,
      include: [
        { 
          model: Bid, 
          as: "bid",
          include: [
            { model: Expert, as: "expert", attributes: ["full_name", "email"] },
            { 
              model: RepairRequest, 
              as: "repair_request",
              include: [{ model: Customer, as: "customer", attributes: ["name", "phone"] }]
            }
          ]
        }
      ],
      order: [["createdAt", "DESC"]],
    });

    // Transform the data to flatten customer and expert info
    const transformedOrders = serviceOrders.map(order => {
      const customer = order.bid?.repair_request?.customer;
      const expert = order.bid?.expert;
      
      return {
        ...order.toJSON(),
        customer_name: customer?.name || "Unknown",
        customer_phone: customer?.phone || "Unknown",
        expert_name: expert?.full_name || "Unknown",
        expert_email: expert?.email || "Unknown",
      };
    });

    // Calculate summary statistics
    const totalOrders = serviceOrders.length;
    const totalRevenue = serviceOrders.reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0);
    const completedOrders = serviceOrders.filter(order => order.status === "completed").length;
    const inProgressOrders = serviceOrders.filter(order => order.status === "in_progress").length;
    const deliveredOrders = serviceOrders.filter(order => order.status === "delivered").length;
    const refundedOrders = serviceOrders.filter(order => order.status === "refunded").length;

    res.status(200).json({
      success: true,
      data: {
        orders: transformedOrders,
        summary: {
          totalOrders,
          totalRevenue,
          completedOrders,
          inProgressOrders,
          deliveredOrders,
          refundedOrders,
        },
        filters: {
          dateFilter,
          customStartDate,
          customEndDate,
          status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Repair Requests Report
export const getRepairRequestsReport = async (req, res, next) => {
  try {
    const { dateFilter, customStartDate, customEndDate, status } = req.query;
    const { startDate, endDate } = getDateRange(dateFilter, customStartDate, customEndDate);

    const whereClause = {
      createdAt: {
        [Op.between]: [startDate, endDate],
      },
    };

    if (status && status !== "all") {
      whereClause.status = status;
    }

    const repairRequests = await RepairRequest.findAll({
      where: whereClause,
      include: [
        { model: Customer, as: "customer", attributes: ["name", "phone"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Transform the data to flatten customer info
    const transformedRequests = repairRequests.map(request => {
      const customer = request.customer;
      
      return {
        ...request.toJSON(),
        customer_name: customer?.name || "Unknown",
        customer_phone: customer?.phone || "Unknown",
      };
    });

    // Calculate summary statistics
    const totalRequests = repairRequests.length;
    const pendingRequests = repairRequests.filter(req => req.status === "pending").length;
    const biddingRequests = repairRequests.filter(req => req.status === "bidding").length;
    const closedRequests = repairRequests.filter(req => req.status === "closed").length;
    const rejectedRequests = repairRequests.filter(req => req.status === "rejected").length;

    res.status(200).json({
      success: true,
      data: {
        requests: transformedRequests,
        summary: {
          totalRequests,
          pendingRequests,
          biddingRequests,
          closedRequests,
          rejectedRequests,
        },
        filters: {
          dateFilter,
          customStartDate,
          customEndDate,
          status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Payments Report
export const getPaymentsReport = async (req, res, next) => {
  try {
    const { dateFilter, customStartDate, customEndDate, status } = req.query;
    const { startDate, endDate } = getDateRange(dateFilter, customStartDate, customEndDate);

    const whereClause = {
      createdAt: {
        [Op.between]: [startDate, endDate],
      },
    };

    if (status && status !== "all") {
      whereClause.status = status;
    }

    const payments = await Payment.findAll({
      where: whereClause,
      include: [
        { 
          model: ServiceOrder, 
          as: "service_order", 
          attributes: ["service_order_id"],
          include: [
            {
              model: Bid,
              as: "bid",
              include: [
                {
                  model: RepairRequest,
                  as: "repair_request",
                  include: [{ model: Customer, as: "customer", attributes: ["name", "phone"] }]
                }
              ]
            }
          ]
        }
      ],
      order: [["createdAt", "DESC"]],
    });

    // Transform the data to flatten customer info
    const transformedPayments = payments.map(payment => {
      const customer = payment.service_order?.bid?.repair_request?.customer;
      
      return {
        ...payment.toJSON(),
        customer_name: customer?.name || "Unknown",
        customer_phone: customer?.phone || "Unknown",
      };
    });

    // Calculate summary statistics
    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
    const paidPayments = payments.filter(payment => payment.status === "paid").length;
    const pendingPayments = payments.filter(payment => payment.status === "pending").length;
    const refundedPayments = payments.filter(payment => payment.status === "refunded").length;
    const cancelledPayments = payments.filter(payment => payment.status === "cancelled").length;

    res.status(200).json({
      success: true,
      data: {
        payments: transformedPayments,
        summary: {
          totalPayments,
          totalAmount,
          paidPayments,
          pendingPayments,
          refundedPayments,
          cancelledPayments,
        },
        filters: {
          dateFilter,
          customStartDate,
          customEndDate,
          status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Payouts Report
export const getPayoutsReport = async (req, res, next) => {
  try {
    const { dateFilter, customStartDate, customEndDate, status } = req.query;
    const { startDate, endDate } = getDateRange(dateFilter, customStartDate, customEndDate);

    const whereClause = {
      createdAt: {
        [Op.between]: [startDate, endDate],
      },
    };

    if (status && status !== "all") {
      whereClause.payout_status = status;
    }

    const payouts = await Payout.findAll({
      where: whereClause,
      include: [
        { model: Expert, as: "expert", attributes: ["full_name", "email"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Transform the data to flatten expert info
    const transformedPayouts = payouts.map(payout => {
      const expert = payout.expert;
      
      return {
        ...payout.toJSON(),
        expert_name: expert?.full_name || "Unknown",
        expert_email: expert?.email || "Unknown",
      };
    });

    // Calculate summary statistics
    const totalPayouts = payouts.length;
    const totalAmount = payouts.reduce((sum, payout) => sum + parseFloat(payout.net_payout || 0), 0);
    const pendingPayouts = payouts.filter(payout => payout.payout_status === "pending").length;
    const releasedPayouts = payouts.filter(payout => payout.payout_status === "released").length;

    res.status(200).json({
      success: true,
      data: {
        payouts: transformedPayouts,
        summary: {
          totalPayouts,
          totalAmount,
          pendingPayouts,
          releasedPayouts,
        },
        filters: {
          dateFilter,
          customStartDate,
          customEndDate,
          status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Customers Report
export const getCustomersReport = async (req, res, next) => {
  try {
    const { dateFilter, customStartDate, customEndDate, isActive } = req.query;
    const { startDate, endDate } = getDateRange(dateFilter, customStartDate, customEndDate);

    const whereClause = {
      createdAt: {
        [Op.between]: [startDate, endDate],
      },
    };

    if (isActive !== undefined && isActive !== "all") {
      whereClause.is_active = isActive === "true";
    }

    const customers = await Customer.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
    });

    // Calculate summary statistics
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(customer => customer.is_active).length;
    const inactiveCustomers = customers.filter(customer => !customer.is_active).length;

    res.status(200).json({
      success: true,
      data: {
        customers,
        summary: {
          totalCustomers,
          activeCustomers,
          inactiveCustomers,
        },
        filters: {
          dateFilter,
          customStartDate,
          customEndDate,
          isActive,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Experts Report
export const getExpertsReport = async (req, res, next) => {
  try {
    const { dateFilter, customStartDate, customEndDate, isActive, isVerified } = req.query;
    const { startDate, endDate } = getDateRange(dateFilter, customStartDate, customEndDate);

    const whereClause = {
      createdAt: {
        [Op.between]: [startDate, endDate],
      },
    };

    if (isActive !== undefined && isActive !== "all") {
      whereClause.is_active = isActive === "true";
    }

    if (isVerified !== undefined && isVerified !== "all") {
      whereClause.is_verified = isVerified === "true";
    }

    const experts = await Expert.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
    });

    // Calculate summary statistics
    const totalExperts = experts.length;
    const activeExperts = experts.filter(expert => expert.is_active).length;
    const inactiveExperts = experts.filter(expert => !expert.is_active).length;
    const verifiedExperts = experts.filter(expert => expert.is_verified).length;
    const unverifiedExperts = experts.filter(expert => !expert.is_verified).length;

    res.status(200).json({
      success: true,
      data: {
        experts,
        summary: {
          totalExperts,
          activeExperts,
          inactiveExperts,
          verifiedExperts,
          unverifiedExperts,
        },
        filters: {
          dateFilter,
          customStartDate,
          customEndDate,
          isActive,
          isVerified,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Bids Report
export const getBidsReport = async (req, res, next) => {
  try {
    const { dateFilter, customStartDate, customEndDate, status } = req.query;
    const { startDate, endDate } = getDateRange(dateFilter, customStartDate, customEndDate);

    const whereClause = {
      createdAt: {
        [Op.between]: [startDate, endDate],
      },
    };

    if (status && status !== "all") {
      if (status === "accepted") {
        whereClause.is_accepted = true;
      } else if (status === "pending") {
        whereClause.is_accepted = false;
      }
    }

    const bids = await Bid.findAll({
      where: whereClause,
      include: [
        { model: Expert, as: "expert", attributes: ["full_name", "email"] },
        { 
          model: RepairRequest, 
          as: "repair_request", 
          attributes: ["request_id", "description"],
          include: [{ model: Customer, as: "customer", attributes: ["name", "phone"] }]
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Transform the data to flatten expert and customer info
    const transformedBids = bids.map(bid => {
      const expert = bid.expert;
      const customer = bid.repair_request?.customer;
      
      return {
        ...bid.toJSON(),
        expert_name: expert?.full_name || "Unknown",
        expert_email: expert?.email || "Unknown",
        customer_name: customer?.name || "Unknown",
        customer_phone: customer?.phone || "Unknown",
      };
    });

    // Calculate summary statistics
    const totalBids = bids.length;
    const acceptedBids = bids.filter(bid => bid.is_accepted).length;
    const pendingBids = bids.filter(bid => !bid.is_accepted).length;
    const totalBidAmount = bids.reduce((sum, bid) => sum + parseFloat(bid.cost || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        bids: transformedBids,
        summary: {
          totalBids,
          acceptedBids,
          pendingBids,
          totalBidAmount,
        },
        filters: {
          dateFilter,
          customStartDate,
          customEndDate,
          status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Refunds Report
export const getRefundsReport = async (req, res, next) => {
  try {
    const { dateFilter, customStartDate, customEndDate, status } = req.query;
    const { startDate, endDate } = getDateRange(dateFilter, customStartDate, customEndDate);

    const whereClause = {
      createdAt: {
        [Op.between]: [startDate, endDate],
      },
    };

    if (status && status !== "all") {
      whereClause.status = status;
    }

    const refunds = await RefundRequest.findAll({
      where: whereClause,
      include: [
        { 
          model: ServiceOrder, 
          as: "service_order", 
          attributes: ["service_order_id"],
          include: [
            {
              model: Bid,
              as: "bid",
              include: [
                {
                  model: RepairRequest,
                  as: "repair_request",
                  include: [{ model: Customer, as: "customer", attributes: ["name", "phone"] }]
                }
              ]
            }
          ]
        }
      ],
      order: [["createdAt", "DESC"]],
    });

    // Transform the data to flatten customer info
    const transformedRefunds = refunds.map(refund => {
      const customer = refund.service_order?.bid?.repair_request?.customer;
      
      return {
        ...refund.toJSON(),
        customer_name: customer?.name || "Unknown",
        customer_phone: customer?.phone || "Unknown",
      };
    });

    // Calculate summary statistics
    const totalRefunds = refunds.length;
    const totalAmount = refunds.reduce((sum, refund) => sum + parseFloat(refund.amount || 0), 0);
    const requestedRefunds = refunds.filter(refund => refund.status === "requested").length;
    const approvedRefunds = refunds.filter(refund => refund.status === "approved").length;
    const rejectedRefunds = refunds.filter(refund => refund.status === "rejected").length;

    res.status(200).json({
      success: true,
      data: {
        refunds: transformedRefunds,
        summary: {
          totalRefunds,
          totalAmount,
          requestedRefunds,
          approvedRefunds,
          rejectedRefunds,
        },
        filters: {
          dateFilter,
          customStartDate,
          customEndDate,
          status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Dashboard Summary Report
export const getDashboardSummary = async (req, res, next) => {
  try {
    const { dateFilter, customStartDate, customEndDate } = req.query;
    const { startDate, endDate } = getDateRange(dateFilter, customStartDate, customEndDate);

    const whereClause = {
      createdAt: {
        [Op.between]: [startDate, endDate],
      },
    };

    // Get counts for different entities
    const [
      serviceOrdersCount,
      repairRequestsCount,
      customersCount,
      expertsCount,
      paymentsCount,
      payoutsCount,
      bidsCount,
      refundsCount,
    ] = await Promise.all([
      ServiceOrder.count({ where: whereClause }),
      RepairRequest.count({ where: whereClause }),
      Customer.count({ where: whereClause }),
      Expert.count({ where: whereClause }),
      Payment.count({ where: whereClause }),
      Payout.count({ where: whereClause }),
      Bid.count({ where: whereClause }),
      RefundRequest.count({ where: whereClause }),
    ]);

    // Get revenue data
    const payments = await Payment.findAll({
      where: {
        ...whereClause,
        status: "paid",
      },
    });

    const totalRevenue = payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          serviceOrdersCount,
          repairRequestsCount,
          customersCount,
          expertsCount,
          paymentsCount,
          payoutsCount,
          bidsCount,
          refundsCount,
          totalRevenue,
        },
        filters: {
          dateFilter,
          customStartDate,
          customEndDate,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
