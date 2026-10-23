const express = require("express");
const router = express.Router();
const cartController = require("../controller/cart.controller");
const { authenticate } = require("../middleware/authenticate.middleware");
const { authorize } = require("../middleware/authorize.middleware");

router.get("/", authenticate, authorize("user"), cartController.getCart);
router.post(
  "/items",
  authenticate,
  authorize("user"),
  cartController.addCartItem,
);
router.put(
  "/items/:itemId",
  authenticate,
  authorize("user"),
  cartController.updateCartItem,
);
router.delete(
  "/items/:itemId",
  authenticate,
  authorize("user"),
  cartController.removeCartItem,
);
router.delete("/", authenticate, authorize("user"), cartController.clearCart);

module.exports = router;
