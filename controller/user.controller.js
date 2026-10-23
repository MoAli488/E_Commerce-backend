const User = require("../model/user.model");
const catchAsyncFn = require("../util/catchAsyncFn.util");
const logger = require("../util/logger.util");
const AppError = require("../util/appError.util");

//admin only
exports.getAllUsers = catchAsyncFn(async (req, res) => {
  const filter = req.query?.filterDelete ? { isDeleted: false } : {};
  const users = await User.find(filter).select("-password");
  if (!users) throw new AppError("User not found", 404);
  logger.info(`Users requested by admin: ${req.user.email}`);
  res.json({ message: "Users fetched.", data: users });
});

//admin only
exports.getUserByEmail = catchAsyncFn(async (req, res) => {
  const user = await User.findOne({ email: req.params.email }).select(
    "-password",
  );
  if (!user) throw new AppError("User not found", 404);
  logger.info(`User fetched by email: ${user.email}`);
  res.json({ message: "User fetched.", data: user });
});

//admin only
exports.addUser = catchAsyncFn(async (req, res) => {
  const { name, email, password, role } = req.body;
  const newUser = await User.create({ name, email, password, role });
  logger.info(`User ${newUser.email} added by admin: ${req.user.email}`);
  res.status(201).json({ message: "User created.", data: newUser });
});

exports.updateUser = catchAsyncFn(async (req, res) => {
  const updatedUser = await findByIdAndUpdate(req.user._id, { ...req.body });
  if (!updatedUser) throw new AppError("User not found", 404);
  logger.info(`User ${updatedUser._id} data updated by ${req.user.email}`);
  res.status(200).json({ message: "User data updated.", data: updatedUser });
});

//admin only
exports.deleteUser = catchAsyncFn(async (req, res) => {
  const deleteUser = await User.findByIdAndUpdate(
    req.params.id,
    { isDeleted: true, isActive: false },
    { new: true },
  );
  if (!deleteUser) throw new AppError("User not found", 404);
  logger.info(`User ${deleteUser.email} deleted by admin: ${req.user.email}`);
  res.status(200).json({ message: "User deleted", data: deleteUser });
});
