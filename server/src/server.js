require("dotenv").config({ path: "../.env" });

// Import Module and Packages
const express = require("express");
const cookieParser = require("cookie-parser");
const { connectDB } = require("./config/db");
const authController = require("./controllers/authController");
const appRouters = require("./routers/appRouters");
const userRouters = require("./routers/userRouters");
const vendorRouters = require("./routers/vendorRouters");
const foodRouters = require("./routers/foodRouters");
const orderRouters = require("./routers/orderRouters");

// Initialize App
const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Vary", "Origin");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// Main Function to Start the Server
async function startServer() {
  await connectDB();

  app.get("/api/health", (req, res) => {
    res.status(200).json({ ok: true, message: "QuickBite API is running" });
  });

  app.post("/api/auth/check-email", authController.checkEmail);
  app.post("/api/auth/register", authController.signup);
  app.post("/api/auth/login", authController.login);
  app.use("/api/app", appRouters);

  // ---------- ROUTERS ----------
  app.use("/api/v1/users", userRouters);
  app.use("/api/v1/vendors", vendorRouters);
  app.use("/api/v1/foods", foodRouters);
  app.use("/api/v1/orders", orderRouters);

  app.listen(process.env.PORT, () => {
    console.log(`🚀 Server running on port ${process.env.PORT}`);
  });
}

// Start the Server
startServer();
