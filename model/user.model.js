const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
// const address = require("./address.model");
const addressSchema = require("./address.model");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
      match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    },
    phone: {
      type: String,
      unique: true,
      trim: true,
      match: /^(\+20|0)?1[0125][0-9]{8}$/,
    },
    addresses: [addressSchema],
    password: {
      type: String,
      trim: true,
      required: true,
      minlength: 8,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  try {
    if (this.isModified("password")) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  } catch (err) {
    console.error(`Error while hashing password: ${err}`);
    res.status(500).json({ error: err });
  }
});

userSchema.methods.isCorrectPassword = async function (inputPassword) {
  try {
    return await bcrypt.compare(inputPassword, this.password);
  } catch (err) {
    throw err;
  }
};

module.exports = mongoose.model("User", userSchema);
