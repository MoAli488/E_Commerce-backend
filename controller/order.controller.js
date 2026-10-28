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
    .select("-cart")
    .sort({ createdAt: -1 });
  logger.info(`Orders fetched by admin: ${req.user.email}`);
  res.json({ message: "Orders fetched", data: orders });
});

exports.getUserOrders = catchAsyncFn(async (req, res) => {
  const query =
    req.user.role === "admin" && req.params.id && req.params.id !== req.user._id
      ? { user: req.params.id }
      : { user: req.user._id };

  const orders = await Order.find(query)
    .populate("orderItems.item")
    .select("-user -cart")
    .sort({ createdAt: -1 });

  if (!orders) throw new AppError("Orders not found", 404);
  logger.info(`Orders fetched for user: ${req.user.email}`);
  res.json({ message: "User orders fetched", data: orders });
});

exports.makeOrder = catchAsyncFn(async (req, res) => {
  const user = req.user;

  const phone = req.body.phone || user.phone;
  if (!phone) {
    throw new AppError("Phone number is required", 400);
  }
  const phoneRegex = /^(\+20|0)?1[0125][0-9]{8}$/;
  if (!phoneRegex.test(phone)) {
    throw new AppError("Invalid phone number format", 400);
  }

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

  const cart = await Cart.findOne({ user: user._id }).populate(
    "cartItems.item"
  );
  if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
    throw new AppError("Cart is empty", 400);
  }

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

  const orderId = new mongoose.Types.ObjectId();
  const orderItems = cart.cartItems.map((cartItem) => ({
    order: orderId,
    item: cartItem.item._id,
    name: cartItem.item.title,
    quantity: cartItem.quantity,
    unit_price: cartItem.item.price,
  }));

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

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
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

    await newOrder.save({ session });

    await CartItem.deleteMany({ cart: cart._id }, { session });
    cart.cartItems = [];
    await cart.save({ session });

    await session.commitTransaction();

    logger.info(`Order ${newOrder._id} created for user: ${user.email}`);
    res.status(201).json({
      message: "Order created successfully",
      data: newOrder,
    });
  } catch (e) {
    await session.abortTransaction();
    logger.error(
      `Error while making order for user ${user.email}, Err: ${e.message}`
    );
    throw e;
  } finally {
    await session.endSession();
  }
});

exports.updateOrderStatus = catchAsyncFn(async (req, res) => {
  const orderId = req.params.id || req.body.id || req.body.orderId;
  if (!orderId) {
    throw new AppError("Order ID is required", 400);
  }

  const query = { _id: orderId };
  if (req.user.role !== "admin") {
    query.user = req.user._id;
    if (
      req.body.status !== "cancelled by client" &&
      req.body.status !== "refunded"
    ) {
      throw new AppError("Unauthorized to set this status", 403);
    }
  }

  const existingOrder = await Order.findOne(query);
  if (!existingOrder) {
    throw new AppError("Order not found", 404);
  }

  const oldStatus = existingOrder.status;
  const newStatus = req.body.status;

  if (oldStatus !== newStatus) {
    const cancelledStatuses = [
      "cancelled by admin",
      "cancelled by client",
      "rejected",
      "refunded",
    ];
    const isCancelling =
      cancelledStatuses.includes(newStatus) &&
      !cancelledStatuses.includes(oldStatus);

    if (isCancelling && existingOrder.orderItems?.length > 0) {
      const restoreStockOps = existingOrder.orderItems.map((oi) => ({
        updateOne: {
          filter: { _id: oi.item },
          update: { $inc: { stock: oi.quantity } },
        },
      }));
      await Product.bulkWrite(restoreStockOps);
      logger.info(`Stock restored for cancelled order: ${existingOrder._id}`);
    }

    existingOrder.status = newStatus;
    await existingOrder.save();
  }

  logger.info(
    `Order ${existingOrder._id} status updated to: ${existingOrder.status}`
  );
  res.json({
    message: `Order ${existingOrder._id} status updated to: ${existingOrder.status}`,
    data: existingOrder,
  });
});

exports.getOrderStats = catchAsyncFn(async (req, res) => {
  const stats = await Order.aggregate([
    {
      $facet: {
        statusBreakdown: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
        summary: [
          { $unwind: "$orderItems" },
          {
            $group: {
              _id: null,
              totalRevenue: {
                $sum: {
                  $multiply: ["$orderItems.unit_price", "$orderItems.quantity"],
                },
              },
              totalUnitsSold: { $sum: "$orderItems.quantity" },
            },
          },
        ],
        topProducts: [
          { $unwind: "$orderItems" },
          {
            $group: {
              _id: "$orderItems.item",
              name: { $first: "$orderItems.name" },
              unitsSold: { $sum: "$orderItems.quantity" },
              totalSales: {
                $sum: {
                  $multiply: ["$orderItems.unit_price", "$orderItems.quantity"],
                },
              },
            },
          },
          { $sort: { unitsSold: -1 } },
          { $limit: 5 },
        ],
      },
    },
  ]);

  const raw = stats[0] || {};
  const statusMap = {};
  (raw.statusBreakdown || []).forEach((s) => {
    statusMap[s._id] = s.count;
  });

  const summary = (raw.summary && raw.summary[0]) || {
    totalRevenue: 0,
    totalUnitsSold: 0,
  };

  res.json({
    message: "Order analytics fetched",
    data: {
      totalRevenue: summary.totalRevenue,
      totalUnitsSold: summary.totalUnitsSold,
      statusBreakdown: statusMap,
      topProducts: raw.topProducts || [],
    },
  });
});
