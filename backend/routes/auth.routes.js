import express from "express";
import {
  registerExpert,
  loginExpert,
  registerCustomer,
  loginCustomer,
  loginAdmin,
} from "../controllers/auth.controller.js";
import { body } from "express-validator";

const router = express.Router();

// Validation rules
const validateExpertRegistration = [
  body("full_name").notEmpty().withMessage("Full name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("service_type_ids")
    .isArray()
    .withMessage("Service type IDs must be an array")
    .notEmpty()
    .withMessage("At least one service type ID is required"),
  body("service_type_ids.*")
    .isInt()
    .withMessage("Each service type ID must be an integer"),
  body("address").notEmpty().withMessage("Address is required"),
];

const validateCustomerRegistration = [
  body("name").notEmpty().withMessage("Name is required"),
  body("phone").notEmpty().withMessage("Phone number is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

const validateLogin = [
  body("email").optional().isEmail().withMessage("Valid email is required"),
  body("phone").optional().notEmpty().withMessage("Phone number is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Expert routes
router.post("/expert/register", validateExpertRegistration, registerExpert);
router.post("/expert/login", validateLogin, loginExpert);

// Customer routes
router.post(
  "/customer/register",
  validateCustomerRegistration,
  registerCustomer
);
router.post("/customer/login", validateLogin, loginCustomer);

// Admin routes
router.post("/admin/login", validateLogin, loginAdmin);

export default router;
