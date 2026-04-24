const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const userService = require("./userService");

/**
 * Generate JWT token
 */
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

/**
 * Format user response with token
 */
const formatAuthResponse = (user) => {
  const token = signToken(user.id);
  user.password = undefined;
  
  return {
    token,
    user,
  };
};

/**
 * User signup with validation
 */
exports.signup = async (signupData) => {
  const { name, email, password, passwordConfirm, role } = signupData;

  // Validation
  if (!email || !password || !passwordConfirm || !name) {
    throw {
      statusCode: 400,
      message: "Please provide all required fields",
    };
  }

  if (password !== passwordConfirm) {
    throw {
      statusCode: 400,
      message: "Passwords do not match",
    };
  }

  // Check if user already exists
  const existingUser = await userService.findByEmail(email);
  if (existingUser) {
    throw {
      statusCode: 400,
      message: "Email already in use",
    };
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const userId = await userService.createUser({
    full_name: name,
    email,
    password: hashedPassword,
    role: role || "Customer",
  });

  const user = { id: userId, name, email, role: role || "Customer" };
  return formatAuthResponse(user);
};

/**
 * User login with email and password validation
 */
exports.login = async (loginData) => {
  const { email, password } = loginData;

  // Validation
  if (!email || !password) {
    throw {
      statusCode: 400,
      message: "Please provide email and password",
    };
  }

  // Check if user exists and verify password
  const user = await userService.findByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw {
      statusCode: 401,
      message: "Incorrect email or password",
    };
  }

  return formatAuthResponse(user);
};

/**
 * Verify JWT token and return user
 */
exports.verifyToken = async (token) => {
  if (!token) {
    throw {
      statusCode: 401,
      message: "You are not logged in. Please log in to get access",
    };
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw {
      statusCode: 401,
      message: "Invalid token. Please log in again",
    };
  }

  // Check if user still exists
  const user = await userService.getUser(decoded.id);
  if (!user) {
    throw {
      statusCode: 401,
      message: "The user belonging to this token no longer exists",
    };
  }

  return user;
};

/**
 * Extract token from request
 */
exports.extractToken = (req) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  return token;
};

/**
 * Generate password reset token
 */
exports.generateResetToken = () => {
  const resetToken = crypto.randomBytes(32).toString("hex");
  
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  return {
    resetToken, // Send this to user
    hashedToken, // Store this in db
    expiresAt,
  };
};

/**
 * Initiate password reset process
 */
exports.forgotPassword = async (email) => {
  // Get user based on email
  const user = await userService.findByEmail(email);
  if (!user) {
    throw {
      statusCode: 404,
      message: "There is no user with this email address",
    };
  }

  // Generate reset token
  const { resetToken, hashedToken, expiresAt } = this.generateResetToken();

  // Save hashed token to db
  await userService.updateUser(user.id, {
    passwordResetToken: hashedToken,
    passwordResetExpires: expiresAt,
  });

  return {
    email: user.email,
    resetToken, // This would be sent via email in production
    resetURL: `${process.env.APP_URL}/api/users/resetPassword/${resetToken}`,
  };
};

/**
 * Reset password with token
 */
exports.resetPassword = async (token, passwordData) => {
  const { password, passwordConfirm } = passwordData;

  // Validate password input
  if (!password || !passwordConfirm) {
    throw {
      statusCode: 400,
      message: "Please provide password and passwordConfirm",
    };
  }

  if (password !== passwordConfirm) {
    throw {
      statusCode: 400,
      message: "Passwords are not the same!",
    };
  }

  // Hash the token sent by user
  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  console.log("Looking for token:", hashedToken);

  // Find user with this reset token
  const user = await userService.findByResetToken(hashedToken);
  
  console.log("User found:", user);

  if (!user) {
    throw {
      statusCode: 400,
      message: "Invalid reset token - token not found",
    };
  }

  const now = Date.now();
  const expiresAt = Number(user.passwordResetExpires);

  console.log("Current time:", now);
  console.log("Token expires at:", expiresAt);
  console.log("Is expired:", expiresAt < now);

  if (expiresAt < now) {
    throw {
      statusCode: 400,
      message: "Password reset token has expired. Please request a new one.",
    };
  }

  // Hash new password and update
  const hashedPassword = await bcrypt.hash(password, 12);

  await userService.updateUser(user.id, {
    password: hashedPassword,
    passwordResetToken: null,
    passwordResetExpires: null,
  });

  return formatAuthResponse(user);
};

/**
 * Update password for authenticated user
 */
exports.updatePassword = async (userId, passwordData) => {
  const { passwordCurrent, password, passwordConfirm } = passwordData;

  // Get user from db
  const user = await userService.getUser(userId);
  if (!user) {
    throw {
      statusCode: 404,
      message: "User not found",
    };
  }

  // Verify current password
  if (!(await bcrypt.compare(passwordCurrent, user.password))) {
    throw {
      statusCode: 401,
      message: "Your current password is wrong.",
    };
  }

  // Validate new passwords match
  if (password !== passwordConfirm) {
    throw {
      statusCode: 400,
      message: "Passwords are not the same!",
    };
  }

  // Hash and update password
  const hashedPassword = await bcrypt.hash(password, 12);

  await userService.updateUser(userId, {
    password: hashedPassword,
  });

  // Fetch updated user
  const updatedUser = await userService.getUser(userId);
  return formatAuthResponse(updatedUser);
};
