const { createLogger, format, transports } = require("winston");

const logger = new createLogger({
  level: process.env.NODE_ENV === "DEV" ? "debug" : "info",
  format: format.combine(
    format.timestamp({ format: "DD-MM-YYYY HH:mm:ss" }),
    format.errors({ stack: true }),
    format.printf((info) => {
      return `${info.timestamp} | ${info.level} | ${info.message} ${info.stack ? "\n\nStack: " + info.stack : ""}`;
    }),
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "logs/erro.log", level: "error" }),
    new transports.File({ filename: "logs/combined.log" }),
  ],
});

module.exports = logger;
