const multer = require("multer");
const path = require("path");
const MB = 1024 * 1024;

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedFiles = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
  if (allowedFiles.includes(ext)) {
    return cb(null, true);
  }
  cb(
    new Error(
      "Invalid file type.\nAllowed types: " + JSON.stringify(allowedFiles),
    ),
    false,
  );
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() + "_" + file.originalname.replace(/[^a-zA-Z0-9.-]+/g, "_"),
    );
  },
});

module.exports = multer({
  fileFilter,
  storage,
  limits: { fileSize: 3 * MB },
});
