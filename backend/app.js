import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { PORT } from "./config/env.js";
import db, { connectDB } from "./database/db.js";
import syncDatabase from "./database/sync.js";
import authRouter from "./routes/auth.routes.js";
import serviceTypeRoutes from "./routes/service-type.routes.js";
// import seed from "./database/seed.js";
import adminRouter from "./routes/admin.routes.js";
import customerRouter from "./routes/customer.routes.js";
import expertRouter from "./routes/expert.routes.js";
import { fileURLToPath } from "url";
import path from "path";

import errorMiddleware from "./middlewares/error.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const corsOptions = {
  origin: "*", // Allow all origins during development
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
// Add basic request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/test", (req, res) => {
  res.json({ status: "ok" });
});
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/service-types", serviceTypeRoutes);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/customer", customerRouter);
app.use("/api/v1/expert", expertRouter);

app.use(errorMiddleware);

app.get("/", (req, res) => {
  res.send("Welcome to the Property Management API!");
});
const server = app.listen(PORT, async () => {
  try {
    await connectDB(); // Test the database connection
    await syncDatabase(); // Call the function to sync the database
    // seed; // Seed the database with initial data
    console.log(
      `Property Management API is running on http://localhost:${PORT}`
    );
  } catch (error) {
    console.error("Failed to connect to the database:", error.message);
    process.exit(1); // Exit the process if the database connection fails
  }
});

export default app;
