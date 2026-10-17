const mongoose = require("mongoose");
const slugify = require("slugify");

const productSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      min: 0.01,
      required: true,
    },
    imageURL: {
      type: String,
      required: true,
      trim: true,
    },
    stock: {
      type: Number,
      min: 0,
      default: 1,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sub-Category",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

//generate slug
productSchema.pre("save", async function () {
  if (this.isModified("title")) {
    this.slug = slugify(this.title);
  }
});

module.exports = mongoose.model("Product", productSchema);
