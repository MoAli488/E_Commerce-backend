const jwt = require("jsonwebtoken");
const User = require("../model/user.model");
const AppError = require("../util/appError.util");
// const catchAsyncFn = require("../util/catchAsyncFn.util");

exports.authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader.startWith("Bearer "))
    // next(new AppError("No token Provided", 401));
    return res.redirect("/login");

  try {
    const token = authHeader.split(" ")[1];
    const decode = jwt.verify(token, process.env.SECRET_KEY);
    req.user = await User.findById(decode._id);
  } catch (e) {
    next(new AppError("Invalid or expired token", 401));
  }
  if (!req.user) throw new AppError("User not found", 401);
  next();
};
