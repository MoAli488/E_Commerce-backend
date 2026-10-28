const express = require("express");
const router = express.Router();
const userController = require("../controller/user.controller");
const { authenticate } = require("../middleware/authenticate.middleware");
const { authorize } = require("../middleware/authorize.middleware");
const addressController = require("../controller/address.controller");

// Address routes (must precede parameterized routes like /:email and /:id)
router.get("/address", authenticate, (req, res) =>
  res.json({ data: req.user.addresses })
);
router.post("/address", authenticate, addressController.addAddress);
router.patch("/address/:id", authenticate, addressController.updateAddress);
router.delete("/address/:id", authenticate, addressController.deleteAddress);

// User routes
router.get("/", authenticate, authorize("admin"), userController.getAllUsers);
router.get(
  "/:email",
  authenticate,
  authorize("user", "admin"),
  userController.getUserByEmail
);
router.post("/", authenticate, authorize("admin"), userController.addUser);
router.put(
  "/:id",
  authenticate,
  authorize("user", "admin"),
  userController.updateUser
);
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  userController.deleteUser
);

module.exports = router;
