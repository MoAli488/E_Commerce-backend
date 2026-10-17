const cors = require("cors");
const AppError = require("../util/appError.util");
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(",");
const corsOptions = {
  origin: function (origin, cb) {
    if (!origin) return cb(null, true);
    if (!allowedOrigins.includes(origin))
      cb(new AppError("Cors policy: Origin not allowed", 403), false);
    cb(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELTE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

module.exports = cors(corsOptions);
