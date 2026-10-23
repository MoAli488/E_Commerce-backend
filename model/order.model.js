const mongoose = require("mongoose");
const OrderItem = require("./order-item.model");

const orderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cart: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      required: true,
    },
    orderItems: {
      type: [
        {
          type: OrderItem.schema,
          ref: "Order-Item",
        },
      ],
      required: true,
    },
    // addressId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Address",
    //   required: true,
    // },
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
        "cancelled by admin",
        "cancelled by client",
        "rejected",
        "refunded",
      ],
      default: "pending",
    },
    orderedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
