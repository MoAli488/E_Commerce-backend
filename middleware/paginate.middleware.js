const catchAsyncFn = require("../util/catchAsyncFn.util");

exports.paginate = (Model) => {
  return catchAsyncFn(async (req, res, next) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 6);
    const skip = (page - 1) * limit;
    const sortBy = req.query.sort || "createdAt";
    const order = req.query.order === "desc" ? -1 : 1;

    const [results, total] = await Promise.all([
      Model.find({ isDeleted: false })
        .sort({ [sortBy]: order })
        .skip(skip)
        .limit(limit),
      Model.countDocuments({ isDeleted: false }),
    ]);

    res.status(200).json({
      message: `Pagination for ${Model.modelName}`,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: results,
    });
  });
};
