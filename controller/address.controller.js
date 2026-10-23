const User = require("../model/user.model");
const AppError = require("../util/appError.util");
const catchAsyncFn = require("../util/catchAsyncFn.util");
const logger = require("../util/logger.util");

const getAddress = (user, id) => user.addresses.id(id);

exports.addAddress = catchAsyncFn(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError("User not found", 404);
  const { title, location, isDefault = false } = req.body;
  if (!location) throw new AppError("Location is required", 400);
  const makeDefault = isDefault || user.addresses.length === 0;
  if (makeDefault)
    user.addresses.forEach((address) => {
      address.isDefault = false;
    });
  user.addresses.push({ title, location, isDefault: makeDefault });
  const newAddress = user.addresses[user.addresses.length - 1];
  await user.save();
  logger.info(`User ${user.email} added address: ${newAddress._id}`);
  res.status(201).json({ message: "Address added", data: newAddress });
});

exports.updateAddress = catchAsyncFn(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError("User not found", 404);
  const address = getAddress(user, req.params.id);
  if (!address) throw new AppError("Address not found", 404);
  const { title, location, isDefault } = req.body;
  if (title !== undefined) address.title = title;
  if (location !== undefined) address.location = location;
  if (isDefault === true)
    user.addresses.forEach((item) => {
      item.isDefault = item._id.equals(address._id);
    });
  if (isDefault === false) address.isDefault = false;
  await user.save();
  logger.info(`User ${user.email} updated address: ${address._id}`);
  res.status(200).json({ message: "Address updated", data: address });
});

exports.deleteAddress = catchAsyncFn(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError("User not found", 404);
  const address = getAddress(user, req.params.id);
  if (!address) throw new AppError("Address not found", 404);
  const wasDefault = address.isDefault;
  address.deleteOne();
  if (wasDefault && user.addresses.length > 0)
    user.addresses[0].isDefault = true;
  await user.save();
  logger.info(`User ${user.email} deleted address: ${req.params.id}`);
  res
    .status(200)
    .json({ message: "Address deleted", data: { id: req.params.id } });
});
