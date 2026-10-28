const mongoose = require("mongoose");
const Order = require("../model/order.model");
const Cart = require("../model/cart.model");
const CartItem = require("../model/cart-item.model");
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

  // 1. Resolve phone number
  const phone = req.body.phone || user.phone;
  if (!phone) {
    throw new AppError("Phone number is required", 400);
  }
  const phoneRegex = /^(\+20|0)?1[0125][0-9]{8}$/;
  if (!phoneRegex.test(phone)) {
    throw new AppError("Invalid phone number format", 400);
  }

  // 2. Resolve address
  let address = req.body.address;
  if (!address && req.body.addressId) {
    const selectedAddress =
      user.addresses?.id(req.body.addressId) ||
      user.addresses?.find(
        (addr) => addr._id.toString() === req.body.addressId
      );
    if (!selectedAddress) {
      throw new AppError("Selected address not found in user profile", 404);
    }
    address = selectedAddress.location;
  }
  if (!address && user.addresses?.length > 0) {
    const defaultAddress =
      user.addresses.find((addr) => addr.isDefault) || user.addresses[0];
    address = defaultAddress?.location;
  }
  if (!address) {
    throw new AppError("Delivery address is required", 400);
  }

  // 3. Find and validate user's cart
  const cart = await Cart.findOne({ user: user._id }).populate(
    "cartItems.item"
  );
  if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
    throw new AppError("Cart is empty", 400);
  }

  // Check if any product is deleted or inactive
  const invalidItems = cart.cartItems.filter(
    (cartItem) =>
      !cartItem.item || cartItem.item.isDeleted || !cartItem.item.isActive
  );
  if (invalidItems.length > 0) {
    throw new AppError(
      "Some items in your cart are no longer available. Please update your cart.",
      400
    );
  }

  // Check stock availability for all items
  const insufficientStockItems = cart.cartItems.filter(
    (cartItem) => cartItem.item.stock < cartItem.quantity
  );
  if (insufficientStockItems.length > 0) {
    const details = insufficientStockItems
      .map(
        (ci) =>
          `"${ci.item.title}" (Available: ${ci.item.stock}, Requested: ${ci.quantity})`
      )
      .join(", ");
    throw new AppError(`Not enough stock for: ${details}`, 400);
  }

  // 4. Perform atomic transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Decrement stock for products atomically
    const bulkStockOps = cart.cartItems.map((cartItem) => ({
      updateOne: {
        filter: { _id: cartItem.item._id, stock: { $gte: cartItem.quantity } },
        update: { $inc: { stock: -cartItem.quantity } },
      },
    }));

    const bulkResult = await Product.bulkWrite(bulkStockOps, { session });
    if (bulkResult.modifiedCount !== cart.cartItems.length) {
      throw new AppError(
        "Could not reserve stock for all items. Some items may have just sold out.",
        400
      );
    }

    // Build order items
    const orderId = new mongoose.Types.ObjectId();
    const orderItems = cart.cartItems.map((cartItem) => ({
      order: orderId,
      item: cartItem.item._id,
      name: cartItem.item.title,
      quantity: cartItem.quantity,
      unit_price: cartItem.item.price,
    }));

    // Create and save new order
    const newOrder = new Order({
      _id: orderId,
      user: user._id,
      cart: cart._id,
      orderItems,
      address,
      phone,
      status: "pending",
      orderedAt: new Date(),
    });
    await newOrder.save({ session });

    // Clear cart and delete cart items
    await CartItem.deleteMany({ cart: cart._id }, { session });
    cart.cartItems = [];
    await cart.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    logger.info(`Order ${newOrder._id} created for user: ${user.email}`);
    res.status(201).json({
      message: "Order created successfully",
      data: newOrder,
    });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    logger.error(
      `Error while making order to user ${user.email}, Err: ${e.message}`
    );
    throw e.statusCode ? e : new AppError(e.message, 500);
  }
});

exports.updateOrderStatus = catchAsyncFn(async (req, res) => {
  const orderId = req.body.id || req.body.orderId || req.params.id;
  if (!orderId) {
    throw new AppError("Order ID is required", 400);
  }
  const updatedOrder = await Order.findByIdAndUpdate(
    orderId,
    {
      status: req.body.status,
    },
    { new: true, runValidators: true }
  );
  if (!updatedOrder) {
    throw new AppError("Order not found", 404);
  }
  logger.info(
    `Order ${updatedOrder._id} status updated to: ${updatedOrder.status}`
  );
  res.json({
    message: `Order ${updatedOrder._id} status updated to: ${updatedOrder.status}`,
    data: updatedOrder,
  });
});

