module.exports = (Fn) => {
  return (req, res, next) => {
    Fn(req, res, next).catch(next);
  };
};
