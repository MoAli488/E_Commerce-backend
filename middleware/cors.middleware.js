const cors = require("cors");
const AppError = require("../util/appError.util");
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:4200", "http://localhost:4000"];

const corsOptions = {
  origin: function (origin, cb) {
    if (!origin) return cb(null, true);
    if (!allowedOrigins.includes(origin)) {
      return cb(new AppError("Cors policy: Origin not allowed", 403), false);
    }
    return cb(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

module.exports = cors(corsOptions);
