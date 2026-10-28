const Product = require("../model/product.model");
const catchAsyncFn = require("../util/catchAsyncFn.util");
const logger = require("../util/logger.util");
const AppError = require("../util/appError.util");
const paginate = require("../util/paginate.util");
const Category = require("../model/category.model");
const SubCategory = require("../model/subCategory.model");
const slugify = require("slugify");

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const filter = async (req) => {
  const {
    title,
    search,
    slug,
    category,
    subCategory,
    price,
    minPrice,
    maxPrice,
  } = req.query;
  const filterOptions = { isDeleted: false, isActive: true };

  const searchTerm = search || title;
  if (searchTerm && String(searchTerm).trim()) {
    const escapedSearch = escapeRegex(String(searchTerm).trim());
    filterOptions.title = { $regex: escapedSearch, $options: "i" };
  } else if (slug) {
    filterOptions.slug = slug;
  }

  if (category) {
    const catSlug = slugify(category, { lower: true });
    const foundCategory = await Category.findOne({
      $or: [{ slug: category }, { slug: catSlug }],
    });
    if (!foundCategory) {
      throw new AppError("Category not found", 404);
    }
    filterOptions.category = foundCategory._id;
  }

  if (subCategory) {
    const subCatSlug = slugify(subCategory, { lower: true });
    const subCategoryFilter = {
      $or: [{ slug: subCategory }, { slug: subCatSlug }],
    };
    if (filterOptions.category) {
      subCategoryFilter.category = filterOptions.category;
    }
    const foundSubCategory = await SubCategory.findOne(subCategoryFilter);
    if (!foundSubCategory) {
      throw new AppError("SubCategory not found", 404);
    }
    filterOptions.subCategory = foundSubCategory._id;
  }

  if (price !== undefined) {
    filterOptions.price = Number(price);
  } else if (minPrice !== undefined || maxPrice !== undefined) {
    filterOptions.price = {};
    if (minPrice !== undefined) filterOptions.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) filterOptions.price.$lte = Number(maxPrice);
  }

  if (req.user?.role === "admin") {
    if (req.query?.filterDelete !== undefined) {
      filterOptions.isDeleted = req.query.filterDelete === "true";
    } else {
      delete filterOptions.isDeleted;
    }
    if (req.query?.filterActive !== undefined) {
      filterOptions.isActive = req.query.filterActive === "true";
    } else {
      delete filterOptions.isActive;
    }
  }

  return filterOptions;
};

exports.addProduct = catchAsyncFn(async (req, res) => {
  const { title, description, price, stock, category, subCategory } = req.body;

  if (!req.file || !req.file.filename) {
    throw new AppError("File image for product not uploaded", 400);
  }

  const categorySlug = slugify(category, { lower: true });
  const myCategory = await Category.findOneAndUpdate(
    { slug: categorySlug },
    { name: category, slug: categorySlug },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const finalSubCategory = subCategory || category;
  const subCategorySlug = slugify(finalSubCategory, { lower: true });
  const mySubCategory = await SubCategory.findOneAndUpdate(
    { slug: subCategorySlug, category: myCategory._id },
    {
      name: finalSubCategory,
      slug: subCategorySlug,
      category: myCategory._id,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const imageURL = "uploads/" + req.file.filename;
  const newProduct = await Product.create({
    title,
    description,
    price: Number(price),
    stock: Number(stock),
    category: myCategory._id,
    subCategory: mySubCategory._id,
    imageURL,
  });

  logger.info(`Product ${newProduct._id} created by admin: ${req.user.email}`);
  res.status(201).json({ message: "Product created.", data: newProduct });
});

exports.getAllProducts = catchAsyncFn(async (req, res) => {
  const filterOptions = await filter(req);

  if (req.query.page || req.query.limit) {
    const [products, totalPages] = await paginate(req, Product, filterOptions);
    logger.info("Products fetched with pagination");
    return res.json({
      message: "Products fetched",
      totalPages,
      data: products,
    });
  }

  const products = await Product.find(filterOptions).populate(
    "category subCategory"
  );

  logger.info("Products fetched");
  res.json({ message: "Products fetched", data: products });
});

exports.getProductBySlug = catchAsyncFn(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).populate(
    "category subCategory"
  );
  if (!product)
    throw new AppError(
      `Can't find product with slug: "${req.params.slug}"`,
      404
    );
  logger.info(`Product fetched by slug: ${req.params.slug}`);
  res.json({ message: "Product fetched", data: product });
});

exports.updateProduct = catchAsyncFn(async (req, res) => {
  const updateData = { ...req.body };
  if (req.file) {
    updateData.imageURL = "uploads/" + req.file.filename;
  }
  if (updateData?.title)
    updateData.slug = slugify(updateData.title, { lower: true });
  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );
  if (!updatedProduct) throw new AppError("Product not found", 404);
  logger.info(
    `Product ${updatedProduct._id} updated by admin: ${req.user.email}`
  );
  res.json({ message: "Product updated", data: updatedProduct });
});

exports.deleteProduct = catchAsyncFn(async (req, res) => {
  const deleteProduct = await Product.findByIdAndUpdate(
    req.params.id,
    { isDeleted: true },
    { new: true }
  );
  if (!deleteProduct) throw new AppError("Product not found", 404);
  logger.info(`Product deleted by admin: ${req.user.email}`);
  res.json({ message: "Product deleted", data: deleteProduct });
});
