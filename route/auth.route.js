const express = require("express");
const router = express.Router();
const authController = require("../controller/auth.controller");

router.post("/", authController.login);
router.post("/", authController.signup);

module.exports = router;
