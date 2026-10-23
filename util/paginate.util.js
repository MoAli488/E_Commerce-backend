const paginate = async (req, Model, filterOptions) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 6;
  const skip = (page - 1) * limit;
  const sortBy = req.query.sort || "createdAt";
  const order = req.query.order === "desc" ? -1 : 1;
  const [result, total] = await Promise.all([
    Model.find(filterOptions)
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(limit),
    Model.countDocuments(),
  ]);

  return [result, Math.ceil(total / limit)];
};

module.exports = paginate;
