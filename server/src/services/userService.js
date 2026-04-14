const userRepo = require("../repositories/userRepository");

exports.getAllUsers = () => userRepo.getAllUsers();

exports.getUser = (id) => userRepo.getUser(id);

exports.createUser = (userData) => userRepo.create(userData);

exports.updateUser = (id, data) => userRepo.updateUserById(id, data);

exports.findByEmail = (email) => userRepo.findByEmail(email);

exports.deleteUser = (id) => userRepo.deleteUser(id);

exports.findByResetToken = (token) => userRepo.findByResetToken(token);