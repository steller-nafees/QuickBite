const authService = require("../services/authService");

/**
 * Helper to send token response
 */
const sendTokenResponse = (authData, statusCode, res) => {
  const { token, user } = authData;

  const cookieOptions = {
    httpOnly: true,
    maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days in milliseconds
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  res.status(statusCode).json({
    status: "success",
    token,
    data: { user },
  });
};

/**
 * User signup
 */
exports.signup = async (req, res) => {
  try {
    const authData = await authService.signup(req.body);
    sendTokenResponse(authData, 201, res);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      status: "fail",
      message: error.message || "Signup failed",
    });
  }
};

/**
 * User login
 */
exports.login = async (req, res) => {
  try {
    const authData = await authService.login(req.body);
    sendTokenResponse(authData, 200, res);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      status: "fail",
      message: error.message || "Login failed",
    });
  }
};

/**
 * Protect routes - verify JWT token
 */
exports.protect = async (req, res, next) => {
  try {
    const token = authService.extractToken(req);
    const user = await authService.verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    const statusCode = error.statusCode || 401;
    res.status(statusCode).json({
      status: "fail",
      message: error.message || "Authentication failed",
    });
  }
};

/**
 * Request password reset
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide email address",
      });
    }

    const result = await authService.forgotPassword(email);

    // TODO: Send reset token via email
    // await sendEmail({
    //   email: result.email,
    //   subject: "Your password reset token (valid for 10 min)",
    //   message: `Your reset URL: ${result.resetURL}`,
    // });

    res.status(200).json({
      status: "success",
      message: "Password reset token sent to email!",
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      status: "fail",
      message: error.message || "Failed to process password reset",
    });
  }
};

/**
 * Reset password with token
 */
exports.resetPassword = async (req, res) => {
  try {
    const authData = await authService.resetPassword(req.params.token, req.body);
    sendTokenResponse(authData, 200, res);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      status: "fail",
      message: error.message || "Password reset failed",
    });
  }
};

/**
 * Update password for authenticated user
 */
exports.updatePassword = async (req, res) => {
  try {
    const authData = await authService.updatePassword(req.user.id, req.body);
    sendTokenResponse(authData, 200, res);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      status: "fail",
      message: error.message || "Password update failed",
    });
  }
};
