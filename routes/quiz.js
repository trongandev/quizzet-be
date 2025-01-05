const express = require("express");
const { authMiddleware, checkAdminMiddleware } = require("../middleware/authorizationMiddleWare");
const { getQuiz, getQuizByUser, getQuizBySubject, getQuizAdmin, getQuizById, createQuiz, deleteQuiz, updateQuiz, DocumentBank, CreateComment, approveQuiz } = require("../controllers/quizController");
const router = express.Router();

router.get("/", getQuiz);
router.get("/documentbank", DocumentBank);
router.get("/getquizbyuser", authMiddleware, getQuizByUser);
router.get("/admin", authMiddleware, checkAdminMiddleware, getQuizAdmin);
router.get("/:slug", getQuizById);
router.get("/subject/:id", getQuizBySubject);
router.post("/", authMiddleware, createQuiz);
router.post("/comment", authMiddleware, CreateComment);
router.patch("/review/:_id", authMiddleware, approveQuiz);
router.patch("/:_id", authMiddleware, updateQuiz);
router.delete("/", authMiddleware, deleteQuiz);

module.exports = router;
