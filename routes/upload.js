const express = require("express");
const { uploadImage, uploadFile } = require("../controllers/uploadController");
const { authMiddleware } = require("../middleware/authorizationMiddleWare");
const multer = require("multer");

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });
router.post("/", authMiddleware, upload.single("image"), uploadImage);
router.post("/file", authMiddleware, upload.single("file"), uploadFile);

module.exports = router;
