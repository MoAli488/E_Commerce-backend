const Testimonial = require("../model/testimonial.model");
const catchAsyncFn = require("../util/catchAsyncFn.util");
const logger = require("../util/logger.util");
const AppError = require("../util/appError.util");
const paginate = require("../util/paginate.util");

exports.getAllTestimonials = catchAsyncFn(async (req, res) => {
  const filterOptions = {};

  if (req.user?.role === "admin") {
    if (req.query.status) {
      filterOptions.status = req.query.status;
    }
  } else {
    filterOptions.status = "approved";
  }

  if (req.query.rate) {
    filterOptions.rate = Number(req.query.rate);
  }

  if (req.query.page || req.query.limit) {
    const [testimonials, totalPages] = await paginate(
      req,
      Testimonial,
      filterOptions
    );
    logger.info("Testimonials fetched with pagination");
    return res.json({
      message: "Testimonials fetched",
      totalPages,
      data: testimonials,
    });
  }

  const testimonials = await Testimonial.find(filterOptions)
    .populate("user", "name email")
    .sort({ createdAt: -1, date: -1 });

  logger.info("Testimonials fetched");
  res.json({ message: "Testimonials fetched", data: testimonials });
});

exports.getAllTestimonialsForAdmin = catchAsyncFn(async (req, res) => {
  const filterOptions = {};

  if (req.query.status) {
    filterOptions.status = req.query.status;
  }

  if (req.query.rate) {
    filterOptions.rate = Number(req.query.rate);
  }

  if (req.query.page || req.query.limit) {
    const [testimonials, totalPages] = await paginate(
      req,
      Testimonial,
      filterOptions
    );
    logger.info(
      `Testimonials fetched for admin: ${req.user.email} with pagination`
    );
    return res.json({
      message: "Testimonials fetched",
      totalPages,
      data: testimonials,
    });
  }

  const testimonials = await Testimonial.find(filterOptions)
    .populate("user", "name email")
    .sort({ createdAt: -1, date: -1 });

  logger.info(`Testimonials fetched for admin: ${req.user.email}`);
  res.json({ message: "Testimonials fetched", data: testimonials });
});

exports.getMyTestimonials = catchAsyncFn(async (req, res) => {
  const filterOptions = { user: req.user._id };

  if (req.query.status) {
    filterOptions.status = req.query.status;
  }

  if (req.query.page || req.query.limit) {
    const [testimonials, totalPages] = await paginate(
      req,
      Testimonial,
      filterOptions
    );
    logger.info(`User testimonials fetched with pagination: ${req.user.email}`);
    return res.json({
      message: "User testimonials fetched",
      totalPages,
      data: testimonials,
    });
  }

  const testimonials = await Testimonial.find(filterOptions)
    .populate("user", "name email")
    .sort({ createdAt: -1, date: -1 });

  logger.info(`User testimonials fetched: ${req.user.email}`);
  res.json({ message: "User testimonials fetched", data: testimonials });
});

exports.getTestimonialById = catchAsyncFn(async (req, res) => {
  const testimonial = await Testimonial.findById(req.params.id).populate(
    "user",
    "name email"
  );

  if (!testimonial) {
    throw new AppError("Testimonial not found", 404);
  }

  if (testimonial.status !== "approved") {
    const isOwner =
      req.user &&
      testimonial.user?._id?.toString() === req.user._id?.toString();
    const isAdmin = req.user?.role === "admin";
    if (!isOwner && !isAdmin) {
      throw new AppError("Testimonial not found", 404);
    }
  }

  logger.info(`Testimonial fetched: ${testimonial._id}`);
  res.json({ message: "Testimonial fetched", data: testimonial });
});

exports.addTestimonial = catchAsyncFn(async (req, res) => {
  const { subject, comment, rate } = req.body;

  if (!comment || rate === undefined) {
    throw new AppError("Comment and rate are required", 400);
  }

  const numRate = Number(rate);
  if (isNaN(numRate) || numRate < 1 || numRate > 5) {
    throw new AppError("Rate must be a number between 1 and 5", 400);
  }

  const status =
    req.user.role === "admin" && req.body.status ? req.body.status : "pending";

  const newTestimonial = await Testimonial.create({
    user: req.user._id,
    subject,
    comment,
    rate: numRate,
    status,
  });

  await newTestimonial.populate("user", "name email");

  logger.info(`Testimonial created by user: ${req.user.email}`);
  res.status(201).json({
    message: "Testimonial submitted successfully",
    data: newTestimonial,
  });
});

exports.updateTestimonial = catchAsyncFn(async (req, res) => {
  const testimonial = await Testimonial.findById(req.params.id);
  if (!testimonial) {
    throw new AppError("Testimonial not found", 404);
  }

  const isOwner = testimonial.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    throw new AppError(
      "You are not authorized to update this testimonial",
      403
    );
  }

  const { subject, comment, rate, status } = req.body;

  if (subject !== undefined) testimonial.subject = subject;
  if (comment !== undefined) testimonial.comment = comment;
  if (rate !== undefined) {
    const numRate = Number(rate);
    if (numRate || numRate < 1 || numRate > 5) {
      throw new AppError("Rate must be a number between 1 and 5", 400);
    }
    testimonial.rate = numRate;
  }

  if (isAdmin && status !== undefined) {
    if (!["approved", "pending", "rejected"].includes(status)) {
      throw new AppError("Invalid status value", 400);
    }
    testimonial.status = status;
  } else if (!isAdmin) {
    testimonial.status = "pending";
  }

  await testimonial.save();
  await testimonial.populate("user", "name email");

  logger.info(`Testimonial ${testimonial._id} updated by ${req.user.email}`);
  res.status(200).json({ message: "Testimonial updated", data: testimonial });
});

exports.updateTestimonialStatus = catchAsyncFn(async (req, res) => {
  const id = req.params.id || req.body.id || req.body.testimonialId;
  if (!id) {
    throw new AppError("Testimonial ID is required", 400);
  }

  const { status } = req.body;

  if (!status || !["approved", "pending", "rejected"].includes(status)) {
    throw new AppError(
      "Status must be 'approved', 'pending', or 'rejected'",
      400
    );
  }

  const testimonial = await Testimonial.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  ).populate("user", "name email");

  if (!testimonial) {
    throw new AppError("Testimonial not found", 404);
  }

  logger.info(
    `Testimonial ${testimonial._id} status updated to "${status}" by admin: ${req.user.email}`
  );
  res.status(200).json({
    message: `Testimonial status updated to ${status}`,
    data: testimonial,
  });
});

exports.deleteTestimonial = catchAsyncFn(async (req, res) => {
  const testimonial = await Testimonial.findById(req.params.id);
  if (!testimonial) {
    throw new AppError("Testimonial not found", 404);
  }

  const isOwner = testimonial.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    throw new AppError(
      "You are not authorized to delete this testimonial",
      403
    );
  }

  await Testimonial.findByIdAndDelete(req.params.id);

  logger.info(`Testimonial ${testimonial._id} deleted by ${req.user.email}`);
  res.status(200).json({ message: "Testimonial deleted", data: testimonial });
});
