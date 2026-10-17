const Product = require("../model/product.model");
const catchAsyncFn = require("../util/catchAsyncFn.util");
const logger = require("../util/logger.util");

//admin only
exports.addProduct = catchAsyncFn(async (req, res) => {
  const { title, desciption, price, stock, category } = req.body;
  if (req.file.filename) {
    const imageURL = "uploads/" + req.file.filename;
    const newProduct = await Product.create({
      title,
      desciption,
      price,
      stock,
      category,
      imageURL,
    });
    logger.info(
      `product ${newProduct} - ${newProduct._id} created by admin: ${req.user.email}`,
    );
    res.status(201).json({ message: "Product created.", data: newProduct });
  } else {
    throw new AppError("File image for product not uploaded", 400);
  }
});

exports.getAllProducts = catchAsyncFn(async (req, res) => {
  const filter = req.query?.filterDelete ? { isDeleted: false } : {};
  const products = await Product.find(filter);
  logger.info("Products fetched");
  // if (!products) throw new AppError(`can't find product with slug:${slug}`, 404);
  res.json({ message: "Products fetched", data: products });
});

exports.getProductBySlug = catchAsyncFn(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (!product)
    throw new AppError(`Can't find product with slug: "${slug}"`, 404);
  logger.info(`Product fetched by slug: ${req.params.slug}`);
  res.json({ message: "Product fetched", data: product });
});

//admin only
exports.updateProduct = catchAsyncFn(async (req, res) => {
  // TODO: find better approach for updating
  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    { ...req.body },
    { new: true },
  );
  if (!updatedProduct) throw new AppError("Product not found", 404);
  logger.info(
    `Product ${updatedProduct._id} updated by admin: ${req.user.email}`,
  );
  res.json({ message: "Product deleted", data: updatedProduct });
});

exports.deleteProduct = catchAsyncFn(async (req, res) => {
  const deleteProduct = await findByIdAndUpdate(
    req.params.id,
    { isDeleted: true },
    { new: true },
  );
  if (!deleteProduct) throw new AppError("Product not found", 404);
  logger.info(`Product deleted by admin: ${req.user.email}`);
  res.json({ message: "Product deleted", data: deleteProduct });
});
