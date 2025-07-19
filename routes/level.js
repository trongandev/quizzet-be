const express = require("express");
const { authMiddleware, checkAdminMiddleware } = require("../middleware/authorizationMiddleWare");
const { getLevelDefinitionById, getAllLevelDefinitions, createLevelDefinition, createLevelDefinitions, updateLevelDefinition } = require("../controllers/levelController");

const router = express.Router();

router.get("/:_id", getLevelDefinitionById); // Lấy thông tin thành tích theo ID
router.get("/", getAllLevelDefinitions); // Lấy tất cả thành tích
router.post("/", authMiddleware, checkAdminMiddleware, createLevelDefinition); // tạo thành tích
router.post("/many", authMiddleware, checkAdminMiddleware, createLevelDefinitions); // tạo nhiều thành tích
router.put("/:_id", authMiddleware, checkAdminMiddleware, updateLevelDefinition); // Cập nhật thành tích
module.exports = router;
