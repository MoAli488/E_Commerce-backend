const mongoose = require("mongoose");
const orderItem = require("./order-item.model");

const orderSchema = mongoose.Schema(
  {
    cart: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      required: true,
    },
    orderItem: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order-Item",
        required: true,
      },
    ],
    addressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: /^(\+20|0)?1[0125][0-9]{8}$/,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "preparing",
        "shipped",
        "delivered",
        "received",
        "cancelled by admin",
        "cancelled by client",
        "rejected",
        "refunded",
      ],
      default: "pending",
    },
    purchasedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
