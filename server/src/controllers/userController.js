const userService = require("../services/userService");

exports.getAllUsers = async (req, res) => {
  const users = await userService.getAllUsers();

  res.status(200).json({
    status: "success",
    results: users.length,
    data: { users },
  });
};

exports.createUser = async (req, res) => {
  const userId = await userService.createUser(req.body);

  res.status(201).json({
    status: "success",
    results: userId,
    data: { userId },
  });
};

exports.getUser = async (req, res) => {
  const user = await userService.getUser(req.params.id);

  res.status(200).json({
    status: "success",
    results: user ? 1 : 0,
    data: { user },
  });
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

    // Update user document
    await userService.updateUser(req.user.id, filteredBody);

    const user = await userService.getUser(req.user.id);

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
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
      message: error.message,
    });
  }
};