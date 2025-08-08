import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  getServiceOrdersReport,
  getRepairRequestsReport,
  getPaymentsReport,
  getPayoutsReport,
  getCustomersReport,
  getExpertsReport,
  getBidsReport,
  getRefundsReport,
  getDashboardSummary,
} from "../controllers/reports.controller.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(verifyToken);

// Dashboard Summary Report
router.get("/dashboard-summary", getDashboardSummary);

// Service Orders Report
router.get("/service-orders", getServiceOrdersReport);

// Repair Requests Report
router.get("/repair-requests", getRepairRequestsReport);

// Payments Report
router.get("/payments", getPaymentsReport);

// Payouts Report
router.get("/payouts", getPayoutsReport);

// Customers Report
router.get("/customers", getCustomersReport);

// Experts Report
router.get("/experts", getExpertsReport);

// Bids Report
router.get("/bids", getBidsReport);

// Refunds Report
router.get("/refunds", getRefundsReport);

export default router;
