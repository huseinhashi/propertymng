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
  updateAdditionalPayment,
  deleteAdditionalPayment,
  markNotificationAsRead,
} from "../controllers/service.order.controller.js";
import {
  getMyPayouts,
  getMyPayoutById,
} from "../controllers/payout.controller.js";
import { getRefundRequestsForOrder } from "../controllers/refund-request.controller.js";
import { getExpertNotifications } from "../controllers/notification.controller.js";

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

// Refunds: allow expert to view refunds for a service order
router.get(
  "/service-orders/:orderId/refunds",

  getRefundRequestsForOrder
);

// Additional payment update/delete
router.patch(
  "/service-orders/:orderId/additional-payment/:paymentId",
  updateAdditionalPayment
);
router.delete(
  "/service-orders/:orderId/additional-payment/:paymentId",
  deleteAdditionalPayment
);

// Payout routes
router.get("/payouts", getMyPayouts);
router.get("/payouts/:id", getMyPayoutById);

// Notifications
router.get("/notifications", getExpertNotifications);
router.patch("/notifications/:id/read", markNotificationAsRead);

export default router;
