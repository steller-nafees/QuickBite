const userService = require("../services/userService");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();

    res.status(200).json({
      status: "success",
      results: users.length,
      data: { users },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to fetch users",
    });
  }
};

exports.createUser = async (req, res) => {
  try {
    if (!req.body.name || !req.body.email || !req.body.password) {
      return res.status(400).json({
        status: "fail",
        message: "Missing required fields: name, email, password",
      });
    }

    const userId = await userService.createUser(req.body);

    res.status(201).json({
      status: "success",
      message: "User created successfully",
      data: { userId },
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: error.message || "Failed to create user",
    });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await userService.getUser(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      results: user ? 1 : 0,
      data: { user },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to fetch user",
    });
  }
};

exports.updateMe = async (req, res) => {
  try {
    // Do not allow password updates on this route
    if (req.body.password || req.body.passwordConfirm) {
      return res.status(400).json({
        status: "fail",
        message:
          "This route is not for password updates. Please use /updatePassword",
      });
    }

    // Filtered out unwanted fields names that are not allowed to be updated
    const filteredBody = {};
    const allowedFields = ["name", "email"];
    Object.keys(req.body).forEach((el) => {
      if (allowedFields.includes(el)) filteredBody[el] = req.body[el];
    });

    if (Object.keys(filteredBody).length === 0) {
      return res.status(400).json({
        status: "fail",
        message: "No valid fields to update",
      });
    }

    // Update user document
    await userService.updateUser(req.user.id, filteredBody);

    const user = await userService.getUser(req.user.id);

    res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: {
        user,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to update profile",
    });
  }
};

exports.deleteMe = async (req, res) => {
  try {
    await userService.deleteUser(req.user.id);

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to delete account",
    });
  }
};