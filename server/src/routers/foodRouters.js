const express = require("express");
const foodController = require("../controllers/foodController");
const authController = require("../controllers/authController");

const foodRouters = express.Router();

// Protect all routes - only authenticated users can access food routes
foodRouters.use(authController.protect);

// Get all foods (protected)
foodRouters.get("/", foodController.getAllFoods);

// Create food - vendor can add their own foods (protected)
foodRouters.post("/", foodController.createFood);

// Get foods by vendor ID (protected) - MUST come before /:id
foodRouters.get("/vendor/:vendorId", foodController.getFoodsByVendor);

// Get specific food (protected)
foodRouters.get("/:id", foodController.getFoodById);

// Update food - vendor can only update their own foods (protected)
foodRouters.patch("/:id", foodController.updateFood);

// Delete food - vendor can only delete their own foods (protected)
foodRouters.delete("/:id", foodController.deleteFood);

module.exports = foodRouters;
