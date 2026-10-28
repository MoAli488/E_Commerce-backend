const express = require("express");
const router = express.Router();
const testimonialController = require("../controller/testimonial.controller");
const {
  authenticate,
  optionalAuthenticate,
} = require("../middleware/authenticate.middleware");
const { authorize } = require("../middleware/authorize.middleware");

router.get("/", optionalAuthenticate, testimonialController.getAllTestimonials);
router.get(
  "/admin",
  authenticate,
  authorize("admin"),
  testimonialController.getAllTestimonialsForAdmin
);
router.get(
  "/my-testimonials",
  authenticate,
  testimonialController.getMyTestimonials
);
router.get(
  "/:id",
  optionalAuthenticate,
  testimonialController.getTestimonialById
);

router.post("/", authenticate, testimonialController.addTestimonial);

router.patch(
  "/:id/status",
  authenticate,
  authorize("admin"),
  testimonialController.updateTestimonialStatus
);
router.put(
  "/:id/status",
  authenticate,
  authorize("admin"),
  testimonialController.updateTestimonialStatus
);
router.patch(
  "/status/:id",
  authenticate,
  authorize("admin"),
  testimonialController.updateTestimonialStatus
);
router.put(
  "/status/:id",
  authenticate,
  authorize("admin"),
  testimonialController.updateTestimonialStatus
);

router.put("/:id", authenticate, testimonialController.updateTestimonial);
router.patch("/:id", authenticate, testimonialController.updateTestimonial);

router.delete("/:id", authenticate, testimonialController.deleteTestimonial);

module.exports = router;
