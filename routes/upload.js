const express = require("express");
const { uploadImage, upload } = require("../controllers/uploadController");
const { authMiddleware } = require("../middleware/authorizationMiddleWare");

const router = express.Router();

router.post("/", authMiddleware, upload.single("file"), uploadImage);

module.exports = router;
