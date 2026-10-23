const express = require("express");
const router = express.Router();
const productController = require("../controller/product.controller");
const { authenticate } = require("../middleware/authenticate.middleware");
const { authorize } = require("../middleware/authorize.middleware");
const upload = require("../middleware/upload.middleware");

router.get(
  "/",
  authenticate,
  authorize("user", "admin"),
  productController.getAllProducts
);
router.get(
  "/:slug",
  authenticate,
  authorize("user", "admin"),
  productController.getProductBySlug
);
router.post(
  "/",
  authenticate,
  authorize("admin"),
  upload.single("img"),
  productController.addProduct
);
router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  upload.single("img"),
  productController.updateProduct
);
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  productController.deleteProduct
);

module.exports = router;
