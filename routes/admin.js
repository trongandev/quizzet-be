const express = require("express");
const { analysticAll } = require("../controllers/adminController");
const { authMiddleware, checkAdminMiddleware } = require("../middleware/authorizationMiddleWare");
const router = express.Router();

router.get("/analystic", authMiddleware, checkAdminMiddleware, analysticAll);

module.exports = router;
