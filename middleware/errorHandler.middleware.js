const AppError = require("../util/appError.util");
const logger = require("../util/logger.util");

module.exports = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (process.env.NODE_ENV === "DEV") {
    return res.status(err.statusCode).json({
      status: err.status,
      statusCode: err.statusCode,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  }
  if (isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      statusCode: err.statusCode,
      message: err.message,
    });
  } else {
    res.status(err.statusCode).json({
      status: err.status,
      statusCode: err.statusCode,
      message: "something went wrong",
    });
  }
};
