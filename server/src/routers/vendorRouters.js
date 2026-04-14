const express = require("express");
const vendorController = require("../controllers/vendorController");
const authController = require("../controllers/authController");

const vendorRouters = express.Router();

// Protect all routes - only authenticated users can access vendor routes
vendorRouters.use(authController.protect);

// Get all vendors (protected)
vendorRouters.get("/", vendorController.getAllVendors);

// Get specific vendor (protected)
vendorRouters.get("/:id", vendorController.getVendor);

// Update vendor profile
vendorRouters.patch("/:id", vendorController.updateVendor);

// Delete vendor
vendorRouters.delete("/:id", vendorController.deleteVendor);

module.exports = vendorRouters;
