const User = require("../model/user.model");
const jwt = require("jsonwebtoken");
const catchAsyncFn = require("../util/catchAsyncFn.util");
const AppError = require("../util/appError.util");
const Cart = require("../model/cart.model");
const logger = require("../util/logger.util");

const createToken = (userData) => {
  const { _id, name, email, role } = userData;
  return jwt.sign({ _id, name, email, role }, process.env.SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRIES_IN,
  });
};

exports.login = catchAsyncFn(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || user.isDeleted) throw new AppError("User not found", 404);
  if (user.isBlocked) throw new AppError("Your account has been blocked", 403);

  const passwordMatch = await user.isCorrectPassword(password);
  if (!passwordMatch) throw new AppError("Invalid email or password", 401);
  logger.info(`User logged in: ${user.email}`);
  res.json({ message: "Logged In", token: createToken(user) });
});

exports.signup = catchAsyncFn(async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  try {
    if (password !== confirmPassword)
      throw new AppError("Password and confirm password do not match", 400);
    const newUser = await User.create({
      name,
      email,
      password,
    });
    await Cart.create({ user: newUser._id });
    logger.info(`User signed up: ${newUser.email}`);
    return res
      .status(201)
      .json({ message: "Signed Up", token: createToken(newUser) });
  } catch (err) {
    if (err.code === 11000) {
      logger.error(`Signup failed: Email already exists - ${email}`);
      throw new AppError(
        "User with same email already exists, use a different email.",
        409
      );
    }
    logger.error(`Signup error: ${err.message}`);
    throw err;
  }
});
