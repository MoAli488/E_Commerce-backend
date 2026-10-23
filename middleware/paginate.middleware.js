const catchAsyncFn = require("../util/catchAsyncFn.util");

exports.paginate = (Model) => {
  return catchAsyncFn(async (req, res, next) => {
    const page = req.query.page || 1;
    const limit = req.query.limit || 6;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sort || "createdAt";
    const order = req.query.order === "desc" ? -1 : 1;

    const [results, total] = Promise.all([
      Model.find()
        .sort({ [sortBy]: order })
        .skip(skip)
        .limit(limit),
      Model.countDocuments(),
    ]);

    res.status(300).json({
      message: `Pagination for ${Model.modelName}`,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: results,
    });
  });
};
