const express = require("express");
const { authMiddleware, checkAdminMiddleware } = require("../middleware/authorizationMiddleWare");
const { getHistory, getAllHistory, getHistoryById, createHistory } = require("../controllers/historyController");
const router = express.Router();

router.get("/", authMiddleware, getHistory);
router.get("/admin", authMiddleware, checkAdminMiddleware, getAllHistory);
router.get("/:_id", authMiddleware, getHistoryById);
router.post("/", authMiddleware, createHistory);

module.exports = router;
