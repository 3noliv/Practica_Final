const multer = require("multer");

// Almacenamiento en disco
const disk = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname + "/../storage");
  },
  filename: function (req, file, cb) {
    const ext = file.originalname.split(".").pop();
    const filename = `file-${Date.now()}.${ext}`;
    cb(null, filename);
  },
});
const uploadMiddleware = multer({ storage: disk });

// Almacenamiento en memoria (para IPFS)
const memory = multer.memoryStorage();
const uploadMiddlewareMemory = multer({ storage: memory });

module.exports = {
  uploadMiddleware,
  uploadMiddlewareMemory,
};
