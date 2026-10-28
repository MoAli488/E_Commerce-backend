const express = require("express");
const router = express.Router();
const cartController = require("../controller/cart.controller");
const { authenticate } = require("../middleware/authenticate.middleware");
const { authorize } = require("../middleware/authorize.middleware");

router.get("/", authenticate, authorize("user"), cartController.getCart);
router.post(
  "/item",
  authenticate,
  authorize("user"),
  cartController.addCartItem
);
router.post(
  "/item/guest",
  authenticate,
  authorize("user"),
  cartController.addGuestCartItems
);
router.put(
  "/item/:itemId",
  authenticate,
  authorize("user"),
  cartController.updateCartItem
);
router.delete(
  "/item/:itemId",
  authenticate,
  authorize("user"),
  cartController.removeCartItem
);
router.delete("/", authenticate, authorize("user"), cartController.clearCart);

module.exports = router;
