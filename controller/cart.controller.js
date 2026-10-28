const Cart = require("../model/cart.model");
const Product = require("../model/product.model");
const catchAsyncFn = require("../util/catchAsyncFn.util");
const logger = require("../util/logger.util");
const AppError = require("../util/appError.util");
const CartItem = require("../model/cart-item.model");

exports.getCart = catchAsyncFn(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "cartItems.item"
  );
  if (!cart) {
    throw new AppError("Cart not found", 404);
  }
  cart.cartItems = cart.cartItems.filter((cartItem) => {
    return cartItem.item && !cartItem.item.isDeleted && cartItem.item.isActive;
  });
  cart.cartItems.forEach((cartItem) => {
    if (
      cartItem.oldPrice !== undefined &&
      cartItem.oldPrice !== cartItem.item.price
    ) {
      cartItem.isPriceChanged = true;
    }
  });
  await cart.save();
  logger.info(`Cart fetched for user: ${req.user.email}`);
  res.json({ message: "Cart fetched", data: cart });
});

exports.addCartItem = catchAsyncFn(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new AppError("Cart not found", 404);
  }
  const product = await Product.findById(req.body.item);
  if (!product || product.isDeleted || !product.isActive) {
    throw new AppError("Product not found or unavailable", 404);
  }

  const quantity = Number(req.body.quantity) || 1;
  const cartItemInd = cart.cartItems.findIndex(
    (cartItem) => cartItem.item.toString() === req.body.item.toString()
  );

  if (cartItemInd === -1) {
    const newCartItem = CartItem({
      cart: cart._id,
      item: product._id,
      quantity,
      oldPrice: product.price,
    });
    cart.cartItems.push(newCartItem);
  } else {
    cart.cartItems[cartItemInd].quantity += quantity;
  }

  await cart.save();
  logger.info(`User ${req.user.email} added item to cart: ${req.body.item}`);
  res.status(201).json({ message: "Product added to cart", data: cart });
});

exports.addGuestCartItems = catchAsyncFn(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, cartItems: [] });
  }

  const guestItems = req.body.cartItems || [];
  if (!Array.isArray(guestItems) || guestItems.length === 0) {
    throw new AppError("No items provided", 400);
  }

  const itemIds = guestItems.map((ci) => ci.item || ci._id);

  const products = await Product.find({
    _id: { $in: itemIds },
    isDeleted: false,
    isActive: true,
  });

  if (!products || products.length === 0) {
    throw new AppError("Products not found or unavailable", 404);
  }

  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  for (const guestItem of guestItems) {
    const productId = guestItem.item?.toString();
    const product = productMap.get(productId);

    if (!product) continue;

    const quantity = Number(guestItem.quantity) || 1;

    const existingIndex = cart.cartItems.findIndex(
      (item) => item.item.toString() === productId
    );

    if (existingIndex > -1) {
      cart.cartItems[existingIndex].quantity += quantity;
      cart.cartItems[existingIndex].oldPrice = product.price;
    } else {
      cart.cartItems.push(
        new CartItem({
          cart: cart._id,
          item: product._id,
          quantity,
          oldPrice: product.price,
        })
      );
    }
  }

  await cart.save();
  logger.info(`User ${req.user.email} merged guest cart`);
  res
    .status(200)
    .json({ message: "Guest cart merged successfully", data: cart });
});

exports.updateCartItem = catchAsyncFn(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "cartItems.item"
  );
  if (!cart) {
    throw new AppError("Cart not found", 404);
  }
  const itemId = req.params?.itemId || req.body?.id;
  const cartItem = cart.cartItems.find(
    (ci) =>
      ci._id.toString() === itemId?.toString() ||
      ci.item?._id?.toString() === itemId?.toString()
  );
  if (cartItem) {
    if (cartItem.item) {
      cartItem.oldPrice = cartItem.item.price;
    }
    cartItem.isPriceChanged = false;
    cartItem.quantity = req.body?.quantity
      ? Math.max(1, Number(req.body.quantity))
      : cartItem.quantity;
    await cart.save();
    logger.info(`User ${req.user.email} updated cart item: ${itemId}`);
    res.json({ message: "Cart item updated", data: cart });
  } else {
    throw new AppError("Cart item does not exist", 404);
  }
});

exports.removeCartItem = catchAsyncFn(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new AppError("Cart not found", 404);
  }
  const itemId = req.params?.itemId || req.body?.id;
  cart.cartItems = cart.cartItems.filter(
    (cartItem) =>
      cartItem.item?.toString() !== itemId?.toString() &&
      cartItem._id?.toString() !== itemId?.toString()
  );
  await cart.save();
  logger.info(`User ${req.user.email} removed cart item: ${itemId}`);
  res.json({ message: "Cart item removed", data: cart });
});

exports.clearCart = catchAsyncFn(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new AppError("Cart not found", 404);
  }
  await CartItem.deleteMany({ cart: cart._id });
  cart.cartItems = [];
  await cart.save();
  logger.info(`Cart cleared for user: ${req.user.email}`);
  res.json({ message: "Cart cleared" });
});
