const mongoose = require("mongoose");

const cartItemSchema = mongoose.Schema({
  cart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cart",
    required: true,
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  oldPrice: {
    type: Number,
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1,
  },
  isPriceChanged: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Cart-Item", cartItemSchema);
