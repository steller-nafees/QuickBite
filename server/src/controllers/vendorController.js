const vendorService = require("../services/vendorService");

// Get all vendors (all users with role = 'vendor')
exports.getAllVendors = async (req, res) => {
  try {
    const vendors = await vendorService.getAllVendors();

    res.status(200).json({
      status: "success",
      results: vendors.length,
      message: vendors.length === 0 ? "No vendors found" : "Vendors retrieved successfully",
      data: { vendors },
    });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to fetch vendors",
    });
  }
};

// Get single vendor by ID
exports.getVendor = async (req, res) => {
  try {
    if (!req.params.id || isNaN(req.params.id)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid vendor ID provided",
      });
    }

    const vendor = await vendorService.getVendor(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        status: "fail",
        message: "Vendor not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: { vendor },
    });
  } catch (error) {
    console.error("Error fetching vendor:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to fetch vendor",
    });
  }
};

// Update vendor
exports.updateVendor = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid vendor ID provided",
      });
    }

    // Verify that the user is updating their own vendor profile
    if (parseInt(id) !== req.user.id) {
      return res.status(403).json({
        status: "fail",
        message: "You can only update your own vendor profile",
      });
    }

    const { role, id: bodyId, ...allowedFields } = req.body;

    // Prevent changing role through this route
    if (Object.keys(allowedFields).length === 0) {
      return res.status(400).json({
        status: "fail",
        message: "No valid fields to update",
      });
    }

    await vendorService.updateVendor(id, allowedFields);

    res.status(200).json({
      status: "success",
      message: "Vendor updated successfully",
    });
  } catch (error) {
    console.error("Error updating vendor:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to update vendor",
    });
  }
};

// Delete vendor
exports.deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid vendor ID provided",
      });
    }

    // Verify that the user is deleting their own vendor profile
    if (parseInt(id) !== req.user.id) {
      return res.status(403).json({
        status: "fail",
        message: "You can only delete your own vendor profile",
      });
    }

    await vendorService.deleteVendor(id);

    res.status(204).json({
      status: "success",
      message: "Vendor deleted successfully",
      data: null,
    });
  } catch (error) {
    console.error("Error deleting vendor:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to delete vendor",
    });
  }
};
