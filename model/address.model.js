const mongoose = require("mongoose");

const addressSchema = mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = addressSchema;
// module.exports = mongoose.model("Address", addressSchema);
