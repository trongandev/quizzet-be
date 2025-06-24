const express = require("express");
const { getAllCache, getCacheByKey, deleteCacheByKey, deleteCacheById, deleteAllCache, deleteExpiredCache, setCache } = require("../controllers/cacheController");

const router = express.Router();

// GET /api/cache - Lấy tất cả cache
router.get("/", getAllCache);

// GET /api/cache/key/:key - Lấy cache theo key
router.get("/key/:key", getCacheByKey);

// POST /api/cache - Tạo hoặc cập nhật cache
router.post("/", setCache);

// DELETE /api/cache/key/:key - Xóa cache theo key
router.delete("/key/:key", deleteCacheByKey);

// DELETE /api/cache/id/:id - Xóa cache theo ID
router.delete("/id/:id", deleteCacheById);

// DELETE /api/cache/all - Xóa tất cả cache
router.delete("/all", deleteAllCache);

// DELETE /api/cache/expired - Xóa cache đã hết hạn
router.delete("/expired", deleteExpiredCache);

module.exports = router;
