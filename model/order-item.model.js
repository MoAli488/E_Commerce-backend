const mongoose = require("mongoose");

const orderItemSchema = mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    unit_price: {
      type: Number,
      required: true,
    },
  },
});

module.exports = mongoose.model("Order-Item", orderItemSchema);
