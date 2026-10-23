const jwt = require("jsonwebtoken");
const User = require("../model/user.model");
const AppError = require("../util/appError.util");
// const catchAsyncFn = require("../util/catchAsyncFn.util");

exports.authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new AppError("No token provided", 401));
  }

  try {
    const token = authHeader.split(" ")[1];
    const decode = jwt.verify(token, process.env.SECRET_KEY);
    req.user = await User.findById(decode._id);
  } catch (e) {
    return next(new AppError("Invalid or expired token", 401));
  }
  if (!req.user) return next(new AppError("User not found", 401));
  next();
};
