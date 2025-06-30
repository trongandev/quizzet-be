const express = require("express");
const { uploadImage } = require("../controllers/uploadController");
const { authMiddleware } = require("../middleware/authorizationMiddleWare");
const multer = require("multer");

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });
router.post("/", authMiddleware, upload.single("image"), uploadImage);

module.exports = router;
