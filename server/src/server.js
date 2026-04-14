require("dotenv").config();

// Import Module and Packages
const express = require("express");
const cookieParser = require("cookie-parser");
const { connectDB } = require("./config/db");
const userRouters = require("./routers/userRouters");

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

  app.listen(process.env.PORT, () => {
    console.log(`🚀 Server running on port ${process.env.PORT}`);
  });
}

// Start the Server
startServer();
