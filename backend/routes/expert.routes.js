import express from "express";
import { verifyToken, isExpert } from "../middlewares/auth.middleware.js";
import {
  getMyBids,
  getMyBidForRequest,
  createBid,
  updateMyBid,
  deleteMyBid,
  getAvailableRequests,
  getRequestById,
} from "../controllers/expert.bid.controller.js";
import {
  getExpertServiceOrders,
  getServiceOrderById,
  updateServiceOrderStatus,
  requestAdditionalPayment,
} from "../controllers/service.order.controller.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);
router.use(isExpert);

// Bid routes
router.get("/bids", getMyBids);
router.get("/bids/available-requests", getAvailableRequests);
router.get("/bids/request/:requestId", getMyBidForRequest);
router.post("/bids", createBid);
router.patch("/bids/:id", updateMyBid);
router.delete("/bids/:id", deleteMyBid);
router.get("/repair-requests/:id", getRequestById);

// Service Order routes
router.get("/service-orders", getExpertServiceOrders);
router.get("/service-orders/:id", getServiceOrderById);
router.patch("/service-orders/:id/status", updateServiceOrderStatus);
router.post("/service-orders/:id/additional-payment", requestAdditionalPayment);

export default router;
