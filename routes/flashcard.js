const express = require("express");
const {
    createFlashCard,
    getFlashCardById,
    updateFlashCard,
    deleteFlashCard,
    createListFlashCard,
    getAllListFlashCards,
    getListFlashCardById,
    updateListFlashCard,
    deleteListFlashCard,
    getAllFlashCardsPublic,
    getAllFlashCards,
    createListFlashCards,
    createFlashCardAI,
    batchRate,
    getFlashCardByIdToPractive,
    statisticsSumarry,
    translateAIEnhance,
    getAllListFlashCardsWithExtension,
    getFlashCardToPractive,
} = require("../controllers/flashCardController");
const { authMiddleware, checkAdminMiddleware } = require("../middleware/authorizationMiddleWare");

const router = express.Router();

// AI create flashcard
router.post("/flashcards/create-ai", authMiddleware, createFlashCardAI); // Tạo flashcard bằng AI
router.post("/flashcards/translate", authMiddleware, translateAIEnhance); // Tạo dịch bằng AI

// Flashcard Routes
router.post("/flashcards", authMiddleware, createFlashCard); // Tạo flashcard mới
router.post("/flashcards/create-ai-list", authMiddleware, createListFlashCards); // Tạo nhiều flashcard mới
// router.get("/flashcards/user", authMiddleware, getFlashCardByUser); // Lấy tất cả flashcards user
router.get("/flashcards/practice/:fc_id", authMiddleware, getFlashCardByIdToPractive); // Lấy flashcard theo ID
router.get("/flashcards/practice", authMiddleware, getFlashCardToPractive); // Lấy flashcard theo ID
router.get("/flashcards/:id", getFlashCardById); // Lấy flashcard theo ID
router.put("/flashcards/batch-rate", authMiddleware, batchRate); // Cập nhật đánh giá cho nhiều flashcard cùng lúc

router.put("/flashcards/:_id", authMiddleware, updateFlashCard); // Cập nhật flashcard
router.delete("/flashcards/:_id", authMiddleware, deleteFlashCard); // Xóa flashcard

// List Flashcard Routes
router.post("/list-flashcards", authMiddleware, createListFlashCard); // Tạo danh sách flashcards mới
router.get("/list-flashcards/admin", authMiddleware, checkAdminMiddleware, getAllFlashCards); // lấy tất cả flashcards
router.get("/list-flashcards/public", getAllFlashCardsPublic); // lấy tất cả danh sách flashcards public
router.get("/list-flashcards", authMiddleware, getAllListFlashCards); // Lấy tất cả danh sách flashcards của user
router.get("/list-flashcards/exten", authMiddleware, getAllListFlashCardsWithExtension); // Sử dụng để lấy danh sách flashcards cho extension
router.get("/list-flashcards/:id", authMiddleware, getListFlashCardById); // Lấy danh sách flashcards theo ID
router.patch("/list-flashcards/:_id", authMiddleware, updateListFlashCard); // Cập nhật danh sách flashcards
router.delete("/list-flashcards/:id", authMiddleware, deleteListFlashCard); // Xóa danh sách flashcards

// tính năng
// router.get("/list-flashcards/admin", authMiddleware); // lấy tất cả flashcards

// Routes cho tiến trình học tập
router.get("/flashcard/summary", authMiddleware, statisticsSumarry); // Lấy tiến trình học tập của người dùng

module.exports = router;
