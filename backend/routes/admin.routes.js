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
import { authenticate, restrictTo } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(authenticate);
router.use(restrictTo("admin"));
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
export default router;
