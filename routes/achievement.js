const express = require("express");
const { authMiddleware, checkAdminMiddleware } = require("../middleware/authorizationMiddleWare");
const {
    getAllAchievementDefinitions,
    getAchievementDefinitionById,
    createAchievementDefinition,
    updateAchievementDefinition,
    createAchievementDefinitions,
} = require("../controllers/achievementController");
const router = express.Router();

router.get("/:_id", getAchievementDefinitionById); // Lấy thông tin thành tích theo ID
router.get("/", getAllAchievementDefinitions); // Lấy tất cả thành tích
router.post("/", authMiddleware, checkAdminMiddleware, createAchievementDefinition); // tạo thành tích
router.post("/many", authMiddleware, checkAdminMiddleware, createAchievementDefinitions); // tạo nhiều thành tích
router.put("/:_id", authMiddleware, checkAdminMiddleware, updateAchievementDefinition); // Cập nhật thành tích
module.exports = router;
