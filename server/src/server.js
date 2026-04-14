require("dotenv").config();

// Import Module and Packages
const express = require("express");
const cookieParser = require("cookie-parser");
const { connectDB } = require("./config/db");
const userRouters = require("./routers/userRouters");
const vendorRouters = require("./routers/vendorRouters");
const foodRouters = require("./routers/foodRouters");

// Initialize App
const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());

// Main Function to Start the Server
async function startServer() {
  await connectDB();

  // ---------- ROUTERS ----------
  app.use("/api/v1/users", userRouters);
  app.use("/api/v1/vendors", vendorRouters);
  app.use("/api/v1/foods", foodRouters);

  app.listen(process.env.PORT, () => {
    console.log(`🚀 Server running on port ${process.env.PORT}`);
  });
}

// Start the Server
startServer();
