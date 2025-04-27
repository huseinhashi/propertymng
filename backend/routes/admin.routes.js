import express from "express";
import {
  getAllCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/admin.customer.controller.js";
import {
  getAllExperts,
  createExpert,
  updateExpert,
  deleteExpert,
} from "../controllers/admin.expert.controller.js";
import {
  getAllAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
} from "../controllers/admin.management.controller.js";
import {
  getAllServiceTypes,
  createServiceType,
  updateServiceType,
  deleteServiceType,
} from "../controllers/service-type.controller.js";
import {
  getAllRepairRequests,
  getRepairRequestById,
  createRepairRequest,
  updateRepairRequest,
  deleteRepairRequest,
  getCustomersList,
  getServiceTypesList,
} from "../controllers/admin.repair-request.controller.js";
import {
  getAllBids,
  getBidById,
  getBidsByRequest,
  getBidsByExpert,
  createBid,
  updateBid,
  deleteBid,
  acceptBid,
} from "../controllers/admin.bid.controller.js";
import { verifyToken, isAdmin } from "../middlewares/auth.middleware.js";
import multer from "multer";
import {
  getAllServiceOrders,
  getServiceOrderById,
  getServiceOrderStats,
  updateServiceOrderStatus,
  updatePaymentStatus,
} from "../controllers/admin.service-order.controller.js";
import {
  getAllPayments,
  getPaymentById,
  updatePaymentStatus as updatePaymentStatusAdmin,
  getPaymentStats,
} from "../controllers/admin.payment.controller.js";

const router = express.Router();
router.use(verifyToken);
router.use(isAdmin);

// Setup multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // limit to 5MB
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// Customer routes
router.route("/customers").get(getAllCustomers).post(createCustomer);
router.route("/customers/:id").patch(updateCustomer).delete(deleteCustomer);

// Expert routes
router.route("/experts").get(getAllExperts).post(createExpert);
router.route("/experts/:id").patch(updateExpert).delete(deleteExpert);

// Admin management routes
router.route("/admins").get(getAllAdmins).post(createAdmin);
router.route("/admins/:id").patch(updateAdmin).delete(deleteAdmin);

// Service type routes
router.route("/service-types").get(getAllServiceTypes).post(createServiceType);
router
  .route("/service-types/:id")
  .patch(updateServiceType)
  .delete(deleteServiceType);

// Repair Request routes
router
  .route("/repair-requests")
  .get(getAllRepairRequests)
  .post(upload.array("images", 5), createRepairRequest);

router
  .route("/repair-requests/:id")
  .get(getRepairRequestById)
  .patch(upload.array("images", 5), updateRepairRequest)
  .delete(deleteRepairRequest);

// Bid routes
router.route("/bids").get(getAllBids).post(createBid);
router.route("/bids/:id").get(getBidById).patch(updateBid).delete(deleteBid);
router.route("/bids/:id/accept").patch(acceptBid);
router.route("/bids/request/:requestId").get(getBidsByRequest);
router.route("/bids/expert/:expertId").get(getBidsByExpert);

// Dropdown data routes
router.get("/customers-list", getCustomersList);
router.get("/service-types-list", getServiceTypesList);

// Service order routes
router.get("/service-orders", getAllServiceOrders);
router.get("/service-orders/:id", getServiceOrderById);
router.get("/service-orders-stats", getServiceOrderStats);
router.patch("/service-orders/:id/status", updateServiceOrderStatus);
router.patch("/service-orders/:id/payment", updatePaymentStatus);

// Payment routes
router.get("/payments", getAllPayments);
router.get("/payments/:id", getPaymentById);
router.get("/payments-stats", getPaymentStats);
router.patch("/payments/:id/status", updatePaymentStatusAdmin);

export default router;
