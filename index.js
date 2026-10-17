const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT;
const AppError = require("./util/appError.util");
const dbConfig = require("./config/db.config");
dbConfig.connectDB();

app.use("/files", express.static(path(__dirname, "uploads")));

app.use(express.json());

app.use("/api/v1/product", require("./route/product.route"));
app.use("/api/v1/user", require("./route/user.route"));
app.use("/api/v1/auth", require("./route/auth.route"));

app.use((req, res, next) => {
  next(new AppError(`Can't find page with URL: "${req.originalUrl}"`, 404));
});

app.use(require("./middleware/errorHandler.middleware"));

app.listen(port, () => {
  console.log(`server connected on port: ${port}`);
});
