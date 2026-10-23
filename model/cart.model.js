const mongoose = require("mongoose");
const CartItem = require("./cart-item.model");

const cartSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cartItems: {
      type: [CartItem.schema],
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Cart", cartSchema);
