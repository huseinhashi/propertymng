import express from "express";
import {
  createServiceType,
  getAllServiceTypes,
  updateServiceType,
  deleteServiceType,
} from "../controllers/service-type.controller.js";
import { authenticate, restrictTo } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public route to get all service types
router.get("/", getAllServiceTypes);

// Admin-only routes
router.post("/", authenticate, restrictTo("admin"), createServiceType);
router.put("/:id", authenticate, restrictTo("admin"), updateServiceType);
router.delete("/:id", authenticate, restrictTo("admin"), deleteServiceType);

export default router;
