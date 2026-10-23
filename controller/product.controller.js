const Product = require("../model/product.model");
const catchAsyncFn = require("../util/catchAsyncFn.util");
const logger = require("../util/logger.util");
const AppError = require("../util/appError.util");
const paginate = require("../util/paginate.util");
const Category = require("../model/category.model");
const SubCategory = require("../model/subCategory.model");
const slugify = require("slugify");

const filter = (req) => {
  const { title, slug, category, subCategory, price, minPrice, maxPrice } =
    req.query;
  const filterOptions = { isDeleted: false, isActive: true };
  if (title) filterOptions.title = title;
  else if (slug) filterOptions.slug = slug;
  if (category) filterOptions.category = category;
  if (category && subCategory) filterOptions.subCategory = subCategory;
  if (price) filterOptions.price = price;
  else {
    if (minPrice) filterOptions.minPrice = minPrice;
    if (maxPrice) filterOptions.maxPrice = maxPrice;
  }
  if (req?.user.role === "admin") {
    filterOptions.isDeleted = req.query?.filterDelete;
    filterOptions.isActive = req.query?.filterActive;
  }
  return filterOptions;
};

//admin only
exports.addProduct = catchAsyncFn(async (req, res) => {
  const { title, description, price, stock, category, subCategory } = req.body;

  if (req.file && req.file.filename) {
    const finalSubCategory = subCategory || category;
    const categorySlug = slugify(category);
    const subCategorySlug = slugify(finalSubCategory);

    const myCategory = await Category.findOneAndUpdate(
      { slug: categorySlug },
      { name: category, slug: categorySlug },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const mySubCategory = await SubCategory.findOneAndUpdate(
      { slug: subCategorySlug },
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
      description: description,
      price,
      stock,
      category: myCategory._id,
      subCategory: mySubCategory._id,
      imageURL,
    });
    logger.info(
      `product ${newProduct._id} created by admin: ${req.user.email}`
    );
    res.status(201).json({ message: "Product created.", data: newProduct });
  } else {
    throw new AppError("File image for product not uploaded", 400);
  }
});

exports.getAllProducts = catchAsyncFn(async (req, res) => {
  const filters = filter(req);
  const {
    minPrice = 0,
    maxPrice = Number.MAX_SAFE_INTEGER,
    ...filterOptions
  } = filters;
  if (minPrice && maxPrice) {
    filterOptions.$and = [
      { price: { $gte: minPrice } },
      { price: { $lte: maxPrice } },
    ];
  }
  const products = await Product.find(filterOptions).populate(
    "category subCategory"
  );
  // const [products, totalPages] = await paginate(req, Product, filterOptions);

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

//admin only
exports.updateProduct = catchAsyncFn(async (req, res) => {
  // TODO: find better approach for updating
  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    { ...req.body },
    { new: true }
  );
  if (!updatedProduct) throw new AppError("Product not found", 404);
  logger.info(
    `Product ${updatedProduct._id} updated by admin: ${req.user.email}`
  );
  res.json({ message: "Product deleted", data: updatedProduct });
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
