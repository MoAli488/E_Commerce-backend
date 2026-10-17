const express = require("express");
const router = express.Router();
const productController = require("../controller/product.controller");
const authenticate = require("../middleware/authenticate.middleware");
const authorize = require("../middleware/authorize.middleware");

if (process.env.NODE_ENV === "DEV") {
  router.get("/", productController.getAllProducts);
  router.get("/:slug", productController.getProductBySlug);
  router.post("/", productController.addProduct);
  router.put("/:id", productController.updateProduct);
  router.delete("/:id", productController.deleteProduct);
} else {
  router.get(
    "/",
    authenticate,
    authorize("user", "admin"),
    productController.getAllProducts,
  );
  router.get(
    "/:slug",
    authenticate,
    authorize("user", "admin"),
    productController.getProductBySlug,
  );
  router.post(
    "/",
    authenticate,
    authorize("admin"),
    productController.addProduct,
  );
  router.put(
    "/:id",
    authenticate,
    authorize("admin"),
    productController.updateProduct,
  );
  router.delete(
    "/:id",
    authenticate,
    authorize("admin"),
    productController.deleteProduct,
  );
}

module.exports = router;
