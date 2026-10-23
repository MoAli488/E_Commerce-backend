const express = require("express");
const router = express.Router();
const orderController = require("../controller/order.controller");
const { authenticate } = require("../middleware/authenticate.middleware");
const { authorize } = require("../middleware/authorize.middleware");

router.get("/", authenticate, authorize("admin"), orderController.getAllOrders);
router.get(
  "/:id",
  authenticate,
  authorize("user"),
  orderController.getUserOrders
);
router.post(
  "/create-order",
  authenticate,
  authorize("user"),
  orderController.makeOrder
);
router.put(
  "/update-order",
  authenticate,
  authorize("user", "admin"),
  orderController.updateOrderStatus
);
// router.delete(
//   "/delete-order",
//   authenticate,
//   authorize("admin"),
//   orderController.deleteOrder,
// );

module.exports = router;
