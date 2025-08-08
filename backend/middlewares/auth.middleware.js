import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";
import Customer from "../models/customer.model.js";
import Expert from "../models/expert.model.js";
import Admin from "../models/admin.model.js";
import AppError from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

// Middleware to authenticate users
export const verifyToken = catchAsync(async (req, res, next) => {
  // 1) Check if token exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError("Please log in to access this resource", 401));
  }

  // 2) Verify token
  const decoded = jwt.verify(token, JWT_SECRET);

  // 3) Check if user still exists based on role
  let currentUser = null;

  if (decoded.role === "customer") {
    currentUser = await Customer.findByPk(decoded.customer_id);
  } else if (decoded.role === "expert") {
    currentUser = await Expert.findByPk(decoded.expert_id);
  } else if (decoded.role === "admin") {
    currentUser = await Admin.findByPk(decoded.admin_id);
  }

  if (!currentUser) {
    return next(
      new AppError("The user belonging to this token no longer exists", 401)
    );
  }

  // Store user info and role in request object
  req.user = {
    ...currentUser.dataValues,
    role: decoded.role,
  };

  next();
});

// Role-based access control middleware
export const isCustomer = (req, res, next) => {
  if (req.user.role !== "customer") {
    return next(
      new AppError("You do not have permission to perform this action", 403)
    );
  }
  next();
};

export const isExpert = (req, res, next) => {
  if (req.user.role !== "expert") {
    return next(
      new AppError("You do not have permission to perform this action", 403)
    );
  }
  next();
};

export const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return next(
      new AppError("You do not have permission to perform this action", 403)
    );
  }
  next();
};

// Legacy middleware - for backwards compatibility
export const authenticate = verifyToken;

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }
    next();
  };
};
