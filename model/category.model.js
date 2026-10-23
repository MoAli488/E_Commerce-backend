const mongoose = require("mongoose");
const slugify = require("slugify");

const categorySchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minLength: 2,
    uppercase: true,
  },
  slug: {
    type: String,
    unique: true,
    required: true,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

categorySchema.pre("save", async function () {
  if (this.isModified("name")) {
    this.slug = slugify(this.name);
  }
});

module.exports = mongoose.model("Category", categorySchema);
