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
  if (req.user.isDeleted) {
    return next(new AppError("User account no longer exists", 401));
  }
  if (req.user.isBlocked) {
    return next(new AppError("Your account has been blocked", 403));
  }
  next();
};

// exports.optionalAuthenticate = async (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader?.startsWith("Bearer ")) {
//     return next();
//   }

//   try {
//     const token = authHeader.split(" ")[1];
//     const decode = jwt.verify(token, process.env.SECRET_KEY);
//     const user = await User.findById(decode._id);
//     if (user && !user.isDeleted && !user.isBlocked) {
//       req.user = user;
//     }
//   } catch (e) {
//     // Ignore invalid token for public routes
//   }
//   next();
// };
