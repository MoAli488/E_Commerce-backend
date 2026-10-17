const User = require("../model/user.model");
const jwt = require("jsonwebtoken");
const catchAsyncFn = require("../util/catchAsyncFn.util");
const AppError = require("../util/appError.util");

const createToken = (userData) => {
  const { _id, name, email } = userData;
  return jwt.sign({ _id, name, email }, process.env.SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRIES_IN,
  });
};

exports.login = catchAsyncFn(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new AppError("User not found", 404);
  const passwordMatch = await user.isCorrectPassword(password);
  if (!passwordMatch) throw new AppError("Invalid email or password", 401);
  res.json({ message: "Logged In", token: createToken(user) });
});

exports.signup = catchAsyncFn(async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  try {
    if (password !== confirmPassword)
      throw new AppError("Password and confirm password are not matched", 401);
    const newUser = await User.create({
      name,
      email,
      password,
    });
    res.status(201).json({ message: "Signed Up", token: createToken(newUser) });
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError(
        "User with same email already exist, use different email.",
        401,
      );
    }
    throw err;
  }
});
