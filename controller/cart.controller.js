const Cart = require("../model/cart.model");
const catchAsyncFn = require("../util/catchAsyncFn.util");
const logger = require("../util/logger.util");
const AppError = require("../util/appError.util");
const CartItem = require("../model/cart-item.model");

exports.getCart = catchAsyncFn(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user }).populate(
    "cartItems.item"
  );
  if (!cart) {
    throw new AppError("User not found", 401);
  }
  cart.cartItems = cart.cartItems.filter((cartItem) => {
    return !cartItem.item.isDeleted && cartItem.item.isActive;
  });
  cart.cartItems.map((cartItem) => {
    if (cartItem.oldPrice !== cartItem.item.price) {
      cartItem.isPriceChanged = true;
    }
  });
  await cart.save();
  logger.info(`Cart fetched for user: ${req.user.email}`);
  res.json(cart);
});

exports.addCartItem = catchAsyncFn(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user });
  if (!cart) {
    throw new AppError("User not found", 401);
  }
  const newCartItem = CartItem({
    cart: cart._id,
    item: req.body.item,
    quantity: req.body.quantity,
  });
  const cartItemInd = cart.cartItems.findIndex(
    (cartItem) => cartItem.item._id == newCartItem.item._id
  );
  if (cartItemInd === -1) cart.cartItems = [...cart.cartItems, newCartItem];
  else cart.cartItems[cartItemInd].quantity++;
  await cart.save();
  logger.info(`User ${req.user.email} added item to cart: ${newCartItem.item}`);
  res.status(201).json({ message: "product added to cart", data: cart });
});

exports.updateCartItem = catchAsyncFn(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user }).populate(
    "cartItems.item"
  );
  if (!cart) {
    throw new AppError("User not found", 401);
  }
  const cartItem = cart.cartItems.find(
    (cartItem) => cartItem._id == req.body.id
  );
  if (cartItem) {
    cartItem.oldPrice = cartItem.item.price;
    cartItem.isPriceChanged = false;
    cartItem.quantity = req.body?.quantity
      ? req.body.quantity
      : cartItem.quantity;
    logger.info(`User ${req.user.email} updated cart item: ${req.body.id}`);
    res.json({ message: "Cart item updated" });
  } else {
    throw new AppError("Cart item does not exist", 404);
  }
});

exports.removeCartItem = catchAsyncFn(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user });
  if (!cart) {
    throw new AppError("User not found", 401);
  }
  const itemId = req.params?.itemId || req.body?.id;
  cart.cartItems = cart.cartItems.filter(
    (cartItem) => cartItem.item != itemId && cartItem._id != itemId
  );
  await cart.save();
  logger.info(`User ${req.user.email} removed cart item: ${itemId}`);
  res.json({ message: "Cart item removed", data: cart });
});

exports.clearCart = catchAsyncFn(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user });
  if (!cart) {
    throw new AppError("User not found", 401);
  }
  await CartItem.deleteMany({ cart: cart._id });
  cart.cartItems = [];
  await cart.save();
  logger.info(`Cart cleared for user: ${req.user.email}`);
  res.json({ message: "Cart cleared" });
});
