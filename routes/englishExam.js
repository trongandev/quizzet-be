const express = require("express");
const { authMiddleware, checkAdminMiddleware } = require("../middleware/authorizationMiddleWare");
const {
    validateCreateExam,
    validateUpdateExam,
    validateSubmitResult,
    validateManualGrading,
    validatePagination,
    validateGetExamById,
    validateShareLink,
    validateQuestionData,
} = require("../middleware/examValidation");
const {
    GetAllEnglishExam,
    getEnglishExamById,
    createEnglishExam,
    updateEnglishExam,
    deleteEnglishExam,
    getExamByShareLink,
    submitExamResult,
    getUserExamResults,
    getExamResultDetail,
    getExamStatistics,
    getMyExams,
    cloneExam,
    manualGrading,
    GetAllEnglishExamAdmin,
} = require("../controllers/englishExamController");

const router = express.Router();

// Public routes
router.get("/admin", validatePagination, GetAllEnglishExamAdmin); // Lấy tất cả bài thi (unpublished and published)
router.get("/", validatePagination, GetAllEnglishExam); // Lấy tất cả bài thi (published)
router.get("/share/:shareLink", validateShareLink, getExamByShareLink); // Lấy bài thi theo share link

// Protected routes
router.get("/my-exams", authMiddleware, validatePagination, getMyExams); // Lấy bài thi của chính mình
router.get("/my-results", authMiddleware, validatePagination, getUserExamResults); // Lấy kết quả bài thi của user
router.get("/result/:resultId", authMiddleware, validateGetExamById, getExamResultDetail); // Lấy chi tiết kết quả bài thi
router.get("/:id", authMiddleware, validateGetExamById, getEnglishExamById); // Lấy bài thi theo ID
router.get("/:examId/statistics", authMiddleware, validateGetExamById, getExamStatistics); // Thống kê bài thi (owner only)

router.post("/", authMiddleware, validateCreateExam, validateQuestionData, createEnglishExam); // Tạo bài thi mới
router.post("/:examId/submit", authMiddleware, validateSubmitResult, submitExamResult); // Nộp bài thi
router.post("/:id/clone", authMiddleware, validateGetExamById, cloneExam); // Sao chép bài thi

router.put("/:id", authMiddleware, validateUpdateExam, validateQuestionData, updateEnglishExam); // Cập nhật bài thi
router.put("/result/:resultId/grade", authMiddleware, validateManualGrading, manualGrading); // Chấm điểm thủ công

router.delete("/:id", authMiddleware, validateGetExamById, deleteEnglishExam); // Xóa bài thi

module.exports = router;
