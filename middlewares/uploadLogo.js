const multer = require("multer");

const memoryStorage = multer.memoryStorage();
const uploadLogo = multer({ storage: memoryStorage });

module.exports = uploadLogo;
