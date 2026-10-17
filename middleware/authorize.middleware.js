const catchAsyncFn = require("../util/catchAsyncFn.util");
const AppError = require("../util/appError.util");

exports.authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError("Access Denied", 403));
    }
    next();
  };
};
