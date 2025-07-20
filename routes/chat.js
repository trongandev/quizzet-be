const express = require("express");
const { authMiddleware, checkAdminMiddleware } = require("../middleware/authorizationMiddleWare");
const { Get, GetById, Update, CreateChat, Delete, MarkAsRead } = require("../controllers/chatController");
const router = express.Router();

router.get("/", authMiddleware, Get);
router.get("/:id", authMiddleware, GetById);
router.post("/create-chat", authMiddleware, CreateChat);
router.put("/:id", authMiddleware, Update);
router.delete("/:id", authMiddleware, Delete);
router.post("/:chatId", authMiddleware, MarkAsRead);

module.exports = router;
