const mongoose = require("mongoose");
const Order = require("../model/order.model");
const Cart = require("../model/cart.model");
const Product = require("../model/product.model");
const catchAsyncFn = require("../util/catchAsyncFn.util");
const AppError = require("../util/appError.util");
const logger = require("../util/logger.util");

exports.getAllOrders = catchAsyncFn(async (req, res) => {
  const orders = await Order.find()
    .populate("user", "name email phone")
    .select("-cart");
  logger.info(`Orders fetched by admin: ${req.user.email}`);
  res.json({ message: "Orders fetched", data: orders });
});

exports.getUserOrders = catchAsyncFn(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate("orderItems.item")
    .select("-user -cart");
  if (!orders) throw new AppError("Orders not found", 404);
  logger.info(`Orders fetched for user: ${req.user.email}`);
  res.json({ message: "User orders fetched", data: orders });
});

exports.makeOrder = catchAsyncFn(async (req, res) => {
  const user = req.user;
  if (!user?.phone || user.address.length === 0)
    return res.status(401).json({ message: "required phone and address" });
  const cart = await Cart.findById(req.user._id).populate("cartItems.item");
  const newOrder = await Order({
    cart: cart._id,
    address: user.find((address) => address._id == req.body.addressId),
    phone: user.phone,
    status: "pending",
  });
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const items = cart.cartItems;
    const products = items.map((cartItem) => cartItem.item);
    // products.map(product => {
    //   if(product.stock >= )
    // })
    const notEnoghtItemsStock = cart.cartItems.filter(
      (cartItem) => cartItem.item.stock < cartItem.quantity
    );
    if (notEnoghtItemsStock.length > 0)
      // const itemsStock = cart.cartItems.filter(cartItem => cartItem.item.stock >= cartItem.quantity);
      // itemsStock.forEach(cartItem => {
      //   cartItem
      // })
      await Product.updateMany({ _id: items.item });
    session.endSession();
    logger.info(`Order created for user: ${user.email}`);
    res.status(201).json({ message: "Order created", data: newOrder });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    logger.error(
      `Error while making order to user ${user.email}, Err: ${e.message}`
    );
    throw new AppError(
      `Error while making order to user ${user.email}, Err: ${e.message}`,
      500
    );
  }
});

exports.updateOrderStatus = catchAsyncFn(async (req, res) => {
  const updatedOrder = await Order.findByIdAndUpdate(
    {
      status: req.body.status,
    },
    { new: true }
  );
  logger.info(
    `Order ${updatedOrder?._id} status updated to: ${updatedOrder?.status}`
  );
  res.json({
    message: `Order ${updatedOrder._id} status updated to: ${updatedOrder.status}`,
  });
});
