const User = require("../model/user.model");
const catchAsyncFn = require("../util/catchAsyncFn.util");
const logger = require("../util/logger.util");
const AppError = require("../util/appError.util");
const bcrypt = require("bcrypt");

exports.getAllUsers = catchAsyncFn(async (req, res) => {
  const filter = req.query?.filterDelete ? { isDeleted: false } : {};
  const users = await User.find(filter).select("-password");
  if (!users) throw new AppError("Users not found", 404);
  logger.info(`Users requested by admin: ${req.user.email}`);
  res.json({ message: "Users fetched.", data: users });
});

exports.getUserByEmail = catchAsyncFn(async (req, res) => {
  if (req.user?.role !== "admin" && req.user?.email !== req.params.email) {
    throw new AppError("Access Denied", 403);
  }

  const user = await User.findOne({ email: req.params.email }).select(
    "-password"
  );
  if (!user) throw new AppError("User not found", 404);
  logger.info(`User fetched by email: ${user.email}`);
  res.json({ message: "User fetched.", data: user });
});

exports.addUser = catchAsyncFn(async (req, res) => {
  const { name, email, password, role } = req.body;
  const newUser = await User.create({ name, email, password, role });
  logger.info(`User ${newUser.email} added by admin: ${req.user.email}`);
  res.status(201).json({ message: "User created.", data: newUser });
});

exports.updateUser = catchAsyncFn(async (req, res) => {
  const userData = { ...req.body };
  if (req.user?.role !== "admin") {
    delete userData.role;
    delete userData.isDeleted;
    delete userData.isBlocked;
  }

  if (userData.password !== undefined) {
    if (typeof userData.password !== "string" || userData.password.length < 8) {
      throw new AppError("Password must be at least 8 characters long", 400);
    }
    userData.password = await bcrypt.hash(userData.password, 10);
  }

  const targetId =
    req.user?.role === "admin" && req.params.id ? req.params.id : req.user._id;

  const updatedUser = await User.findByIdAndUpdate(targetId, userData, {
    new: true,
    runValidators: true,
  }).select("-password");
  if (!updatedUser) throw new AppError("User not found", 404);
  logger.info(`User ${updatedUser._id} data updated by ${req.user.email}`);
  res.status(200).json({ message: "User data updated.", data: updatedUser });
});

exports.deleteUser = catchAsyncFn(async (req, res) => {
  const deleteUser = await User.findByIdAndUpdate(
    req.params.id,
    { isDeleted: true },
    { new: true }
  ).select("-password");
  if (!deleteUser) throw new AppError("User not found", 404);
  logger.info(`User ${deleteUser.email} deleted by admin: ${req.user.email}`);
  res.status(200).json({ message: "User deleted", data: deleteUser });
});
