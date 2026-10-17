const express = require("express");
const router = express.Router();
const userController = require("../controller/user.controller");
const authenticate = require("../middleware/authenticate.middleware");
const authorize = require("../middleware/authorize.middleware");
const addressController = require("../controller/address.controller");

router.post("/address", authenticate, addressController.addAddress);
router.get("/address", authenticate, (req, res) =>
  res.json({ data: req.user.addresses }),
);
router.patch("/address/:id", authenticate, addressController.updateAddress);
router.delete("/address/:id", authenticate, addressController.deleteAddress);

if (process.env.NODE_ENV === "DEV") {
  router.get("/", userController.getAllUsers);
  router.get("/:email", userController.getUserByEmail);
  router.post("/", userController.addUser);
  router.put("/:id", userController.updateUser);
  router.delete("/:id", userController.deleteUser);
} else {
  router.get("/", authenticate, authorize("admin"), userController.getAllUsers);
  router.get(
    "/:email",
    authenticate,
    authorize("admin"),
    userController.getUserByEmail,
  );
  router.post("/", authenticate, authorize("admin"), userController.addUser);
  router.put(
    "/:id",
    authenticate,
    authorize("user", "admin"),
    userController.updateUser,
  );
  router.delete(
    "/:id",
    authenticate,
    authorize("admin"),
    userController.deleteUser,
  );
}

module.exports = router;
