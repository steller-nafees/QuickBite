const vendorRepo = require("../repositories/vendorRepository");

exports.getAllVendors = async () => {
  try {
    return await vendorRepo.getAllVendors();
  } catch (error) {
    throw new Error(`Failed to retrieve vendors: ${error.message}`);
  }
};

exports.getVendor = async (id) => {
  try {
    if (!id) {
      throw new Error("Invalid vendor ID");
    }
    return await vendorRepo.getVendor(id);
  } catch (error) {
    throw new Error(`Failed to retrieve vendor: ${error.message}`);
  }
};

exports.updateVendor = async (id, data) => {
  try {
    if (!id) {
      throw new Error("Invalid vendor ID");
    }
    if (!data || Object.keys(data).length === 0) {
      throw new Error("No fields to update");
    }
    return await vendorRepo.updateVendor(id, data);
  } catch (error) {
    throw new Error(`Failed to update vendor: ${error.message}`);
  }
};

exports.deleteVendor = async (id) => {
  try {
    if (!id) {
      throw new Error("Invalid vendor ID");
    }
    return await vendorRepo.deleteVendor(id);
  } catch (error) {
    throw new Error(`Failed to delete vendor: ${error.message}`);
  }
};
