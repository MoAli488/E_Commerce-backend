const mongoose = require("mongoose");

const cartSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cartItems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cart-Item",
        required: true,
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Cart", cartSchema);
