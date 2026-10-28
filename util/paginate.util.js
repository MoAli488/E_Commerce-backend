const paginate = async (req, Model, filterOptions = {}) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 6;
  const skip = (page - 1) * limit;
  const sortBy = req.query.sort || "createdAt";
  const order = req.query.order === "desc" ? -1 : 1;

  let query = Model.find(filterOptions)
    .sort({ [sortBy]: order })
    .skip(skip)
    .limit(limit);

  if (Model.schema.paths.category) {
    query = query.populate("category subCategory");
  }

  const [result, total] = await Promise.all([
    query,
    Model.countDocuments(filterOptions),
  ]);

  return [result, Math.ceil(total / limit)];
};

module.exports = paginate;
