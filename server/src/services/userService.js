const userRepo = require("../repositories/userRepository");

exports.getAllUsers = async () => {
  try {
    return await userRepo.getAllUsers();
  } catch (error) {
    throw new Error(`Failed to retrieve users: ${error.message}`);
  }
};

exports.getUser = async (id) => {
  try {
    if (!id || typeof id !== 'string') {
      throw new Error("Invalid user ID");
    }
    return await userRepo.getUser(id);
  } catch (error) {
    throw new Error(`Failed to retrieve user: ${error.message}`);
  }
};

exports.createUser = async (userData) => {
  try {
    if (!userData.full_name || !userData.email || !userData.password) {
      throw new Error("Missing required fields: full_name, email, password");
    }
    return await userRepo.create(userData);
  } catch (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }
};

exports.updateUser = async (id, data) => {
  try {
    if (!id || typeof id !== 'string') {
      throw new Error("Invalid user ID");
    }
    if (!data || Object.keys(data).length === 0) {
      throw new Error("No fields to update");
    }
    return await userRepo.updateUserById(id, data);
  } catch (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }
};

exports.findByEmail = async (email) => {
  try {
    if (!email) {
      throw new Error("Email is required");
    }
    return await userRepo.findByEmail(email);
  } catch (error) {
    throw new Error(`Failed to find user by email: ${error.message}`);
  }
};

exports.deleteUser = async (id) => {
  try {
    if (!id || typeof id !== 'string') {
      throw new Error("Invalid user ID");
    }
    return await userRepo.deleteUser(id);
  } catch (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
};

exports.findByResetToken = async (token) => {
  try {
    if (!token) {
      throw new Error("Reset token is required");
    }
    return await userRepo.findByResetToken(token);
  } catch (error) {
    throw new Error(`Failed to find user by reset token: ${error.message}`);
  }
};