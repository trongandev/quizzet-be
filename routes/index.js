const express = require("express");

const authRoutes = require("./auth");
const profileRoutes = require("./profile");
const quizRoutes = require("./quiz");
const HistoryRoutes = require("./history");
const AdminRoutes = require("./admin");
const ToolRoutes = require("./tool");
const ChatRoutes = require("./chat");
const uploadRoutes = require("./upload");
const noticeRoutes = require("./notice");
const ChatCommuRoutes = require("./ChatCommunity");
const flashCardRoutes = require("./flashcard");
const reportRoutes = require("./report");
const notifyRoutes = require("./notification");
const cacheRoutes = require("./cache");
const archievementRoutes = require("./achievement");
const soRoutes = require("./so");

const router = express.Router();
router.use("/api/auth", authRoutes);
router.use("/api/profile", profileRoutes);
router.use("/api/quiz", quizRoutes);
router.use("/api/history", HistoryRoutes);
router.use("/api/admin", AdminRoutes);
router.use("/api/tool", ToolRoutes);
router.use("/api/chat", ChatRoutes);
router.use("/api/chatcommu", ChatCommuRoutes);
router.use("/api/upload", uploadRoutes);
router.use("/api/notice", noticeRoutes);
router.use("/api", flashCardRoutes);
router.use("/api/report", reportRoutes);
router.use("/api/notify", notifyRoutes);
router.use("/api/so", soRoutes);
router.use("/api/cache", cacheRoutes);
router.use("/api/achievement", archievementRoutes);

module.exports = router;
