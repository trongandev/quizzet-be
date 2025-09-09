const { body, param, query, validationResult } = require("express-validator");

// Validation middleware to handle errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            ok: false,
            message: "Dữ liệu không hợp lệ",
            errors: errors.array(),
        });
    }
    next();
};

// Validation for creating exam
const validateCreateExam = [
    body("title").notEmpty().withMessage("Tiêu đề bài thi không được để trống").isLength({ min: 3, max: 200 }).withMessage("Tiêu đề phải có từ 3-200 ký tự"),

    body("difficulty").isIn(["a1", "a2", "b1", "b2", "c1", "c2"]).withMessage("Mức độ khó không hợp lệ"),

    body("skills")
        .isArray()
        .withMessage("Kỹ năng mục tiêu phải là mảng")
        .custom((skills) => {
            const validSkills = ["vocabulary", "grammar", "reading", "listening", "writing"];
            return skills.every((skill) => validSkills.includes(skill));
        })
        .withMessage("Kỹ năng mục tiêu không hợp lệ"),

    body("timeLimit").optional().isInt({ min: 1, max: 300 }).withMessage("Thời gian ước tính phải từ 1-300 phút"),

    body("questions").isArray({ min: 1 }).withMessage("Phải có ít nhất 1 câu hỏi"),

    body("questions.*.question_type")
        .isIn(["multiple_choice", "fill_in_the_blank", "matching", "rearrange_sentences", "rewrite_sentence", "image_description", "listening_comprehension", "reading_comprehension"])
        .withMessage("Loại câu hỏi không hợp lệ"),

    body("questions.*.skill_focus").isIn(["vocabulary", "grammar", "reading", "listening", "writing"]).withMessage("Kỹ năng tập trung không hợp lệ"),

    // body("questions.*.question_text").notEmpty().withMessage("Nội dung câu hỏi không được để trống"),

    body("questions.*.score_points").optional().isInt({ min: 1, max: 20 }).withMessage("Điểm số phải từ 1-20"),

    handleValidationErrors,
];

// Validation for updating exam
const validateUpdateExam = [
    param("id").isMongoId().withMessage("ID bài thi không hợp lệ"),

    body("exam_title").optional().isLength({ min: 3, max: 200 }).withMessage("Tiêu đề phải có từ 3-200 ký tự"),

    body("difficulty_level").optional().isIn(["A1", "A2", "B1", "B2", "C1", "C2", "Beginner", "Intermediate", "Advanced"]).withMessage("Mức độ khó không hợp lệ"),

    handleValidationErrors,
];

// Validation for submitting exam result
const validateSubmitResult = [
    param("examId").isMongoId().withMessage("ID bài thi không hợp lệ"),

    body("answers").isArray({ min: 1 }).withMessage("Phải có ít nhất 1 câu trả lời"),

    body("answers.*.question_id").notEmpty().withMessage("ID câu hỏi không được để trống"),

    body("time_taken_minutes").optional().isInt({ min: 0 }).withMessage("Thời gian làm bài phải >= 0"),

    handleValidationErrors,
];

// Validation for manual grading
const validateManualGrading = [
    param("resultId").isMongoId().withMessage("ID kết quả không hợp lệ"),

    body("questionId").notEmpty().withMessage("ID câu hỏi không được để trống"),

    body("score").isFloat({ min: 0 }).withMessage("Điểm số phải >= 0"),

    body("feedback").optional().isLength({ max: 500 }).withMessage("Feedback không được quá 500 ký tự"),

    handleValidationErrors,
];

// Validation for pagination
const validatePagination = [
    query("page").optional().isInt({ min: 1 }).withMessage("Trang phải >= 1"),

    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Giới hạn phải từ 1-100"),

    handleValidationErrors,
];

// Validation for getting exam by ID
const validateGetExamById = [param("id").isMongoId().withMessage("ID bài thi không hợp lệ"), handleValidationErrors];

// Validation for share link
const validateShareLink = [param("shareLink").isLength({ min: 10 }).withMessage("Share link không hợp lệ"), handleValidationErrors];

// Custom validation for question types
const validateQuestionData = (req, res, next) => {
    const { questions } = req.body;

    if (!questions || !Array.isArray(questions)) {
        return next();
    }

    for (const question of questions) {
        const { question_type } = question;

        switch (question_type) {
            case "multiple_choice":
            // case "reading_comprehension":
            case "listening_comprehension":
                if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
                    return res.status(400).json({
                        ok: false,
                        message: `Câu hỏi ${question_type} phải có ít nhất 2 lựa chọn`,
                    });
                }
                if (!question.correct_answer_id) {
                    return res.status(400).json({
                        ok: false,
                        message: `Câu hỏi ${question_type} phải có đáp án đúng`,
                    });
                }
                break;

            case "fill_in_the_blank":
            case "rewrite_sentence":
                if (!question.correct_answer_text) {
                    return res.status(400).json({
                        ok: false,
                        message: `Câu hỏi ${question_type} phải có đáp án đúng`,
                    });
                }
                break;

            case "matching":
                if (!question.left_items || !question.right_items || !question.correct_matches) {
                    return res.status(400).json({
                        ok: false,
                        message: "Câu hỏi matching phải có đầy đủ items và correct_matches",
                    });
                }
                break;

            case "rearrange_sentences":
                if (!question.scrambled_sentences || !question.correct_order_ids) {
                    return res.status(400).json({
                        ok: false,
                        message: "Câu hỏi rearrange phải có scrambled_sentences và correct_order_ids",
                    });
                }
                break;

            case "image_description":
                if (!question.image_url || !question.correct_answer_keywords) {
                    return res.status(400).json({
                        ok: false,
                        message: "Câu hỏi image_description phải có image_url và correct_answer_keywords",
                    });
                }
                break;
        }
    }

    next();
};

module.exports = {
    validateCreateExam,
    validateUpdateExam,
    validateSubmitResult,
    validateManualGrading,
    validatePagination,
    validateGetExamById,
    validateShareLink,
    validateQuestionData,
    handleValidationErrors,
};
