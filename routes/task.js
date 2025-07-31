const express = require("express");
const { authMiddleware, checkAdminMiddleware } = require("../middleware/authorizationMiddleWare");
const { getTaskDefinitions, getTasks, createTask, createManyTask, updateTask, reloadTask } = require("../controllers/taskController");

const router = express.Router();

router.get("/", getTaskDefinitions); // Lấy thông tin thành tích theo ID
router.get("/admin", getTasks); // Lấy thông tin thành tích theo ID
router.get("/reload", reloadTask); // Lấy thông tin thành tích theo ID
router.post("/", authMiddleware, checkAdminMiddleware, createTask); // tạo thành tích
router.post("/many", authMiddleware, checkAdminMiddleware, createManyTask); // tạo nhiều thành tích
router.put("/:_id", authMiddleware, checkAdminMiddleware, updateTask); // Cập nhật thành tích
module.exports = router;
