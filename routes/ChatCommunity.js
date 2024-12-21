const express = require("express");
const { authMiddleware } = require("../middleware/authorizationMiddleWare");
const { getMessages, addMessage, addReaction } = require("../controllers/ChatCommunityController");

const router = express.Router();
router.get("/", getMessages);
router.post("/", authMiddleware, addMessage);
router.post("/react", authMiddleware, addReaction);
module.exports = router;
