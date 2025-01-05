const express = require("express");
const { createNotification, getUserNotifications, markAsRead, deleteNotification } = require("../controllers/notificationController");
const { authMiddleware, checkAdminMiddleware } = require("../middleware/authorizationMiddleWare");
const router = express.Router();

router.post("/", authMiddleware, createNotification);
router.get("/", authMiddleware, getUserNotifications);
router.get("/:notificationId", authMiddleware, markAsRead);
router.delete("/:notificationId", authMiddleware, deleteNotification);

module.exports = router;
