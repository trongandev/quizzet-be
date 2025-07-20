const express = require("express");
const { authMiddleware, checkAdminMiddleware } = require("../middleware/authorizationMiddleWare");
const { getGamification } = require("../controllers/gamificationController");

const router = express.Router();

router.get("/", authMiddleware, getGamification); // Lấy thông tin thành tích theo ID
// router.post("/", authMiddleware, checkAdminMiddleware, createTask); // tạo thành tích
// router.post("/many", authMiddleware, checkAdminMiddleware, createManyTask); // tạo nhiều thành tích
// router.put("/:_id", authMiddleware, checkAdminMiddleware, updateTask); // Cập nhật thành tích
module.exports = router;
