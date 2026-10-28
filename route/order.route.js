const express = require("express");
const router = express.Router();
const orderController = require("../controller/order.controller");
const { authenticate } = require("../middleware/authenticate.middleware");
const { authorize } = require("../middleware/authorize.middleware");

router.get("/", authenticate, authorize("admin"), orderController.getAllOrders);
router.get(
  "/stats",
  authenticate,
  authorize("admin"),
  orderController.getOrderStats
);
router.get("/my-orders", authenticate, orderController.getUserOrders);
router.get(
  "/:id",
  authenticate,
  authorize("user", "admin"),
  orderController.getUserOrders
);
router.post(
  "/create-order",
  authenticate,
  authorize("user", "admin"),
  orderController.makeOrder
);
router.put(
  "/update-order",
  authenticate,
  authorize("user", "admin"),
  orderController.updateOrderStatus
);
router.put(
  "/update-order/:id",
  authenticate,
  authorize("user", "admin"),
  orderController.updateOrderStatus
);

module.exports = router;
