import express from "express";
import {
  createRepairRequest,
  getCustomerRepairRequests,
  getCustomerRepairRequestById,
} from "../controllers/repair-request.controller.js";
import { acceptBid } from "../controllers/customer.bid.controller.js";
import { verifyToken, isCustomer } from "../middlewares/auth.middleware.js";
import multer from "multer";
import {
  getCustomerServiceOrders,
  getServiceOrderById,
  processPayment,
  processPaymentById,
} from "../controllers/service.order.controller.js";

const router = express.Router();

// Configure multer for handling image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Apply authentication middleware to all routes
router.use(verifyToken);
router.use(isCustomer);

// Repair request routes
router.post("/repair-requests", upload.array("images", 5), createRepairRequest);
router.get("/repair-requests", getCustomerRepairRequests);
router.get("/repair-requests/:id", getCustomerRepairRequestById);

// Bid routes
router.patch("/bids/:id/accept", acceptBid);

// Service Order routes
router.get("/service-orders", getCustomerServiceOrders);
router.get("/service-orders/:id", getServiceOrderById);
router.post("/service-orders/:id/payment", processPayment);
router.post("/payments/:paymentId/process", processPaymentById);

export default router;
