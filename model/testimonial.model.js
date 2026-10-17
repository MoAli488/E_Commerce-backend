const mongoose = require("mongoose");

const testimonialSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  subject: {
    type: String,
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
  },
  rate: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  status: {
    type: String,
    enum: ["approved", "pending", "rejected"],
    default: "pending",
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Testimonial", testimonialSchema);
