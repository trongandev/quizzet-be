const EnglishExam = require("../models/EnglishExam");
const EnglishExamResult = require("../models/EnglishExamResult");
const { v4: uuidv4 } = require("uuid");
const { handleCreateActivity } = require("../services/helperFunction");
const ExamGradingService = require("../services/examGradingService");

exports.GetAllEnglishExamAdmin = async (req, res) => {
    try {
        const { page = 1, limit = 10, difficulty_level, target_skills, is_published = true } = req.query;
        const skip = (page - 1) * limit;

        // Build filter object
        const filter = { is_published };
        if (difficulty_level) filter.difficulty_level = difficulty_level;
        if (target_skills) filter.target_skills = { $in: target_skills.split(",") };

        const englishExams = await EnglishExam.find(filter).populate("user_id", "_id displayName profilePicture").sort({ created_at: -1 }).skip(skip).limit(Number(limit)).lean();

        const total = await EnglishExam.countDocuments(filter);

        res.status(200).json({
            ok: true,
            englishExams,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

// Lấy tất cả bài thi
exports.GetAllEnglishExam = async (req, res) => {
    try {
        const { page = 1, limit = 10, difficulty_level, target_skills, is_published = true } = req.query;
        const skip = (page - 1) * limit;

        // Build filter object
        const filter = { is_published };
        if (difficulty_level) filter.difficulty_level = difficulty_level;
        if (target_skills) filter.target_skills = { $in: target_skills.split(",") };

        const englishExams = await EnglishExam.find().populate("user_id", "_id displayName profilePicture").sort({ created_at: -1 }).skip(skip).limit(Number(limit)).lean();

        const total = await EnglishExam.countDocuments(filter);

        res.status(200).json({
            ok: true,
            englishExams,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

// Lấy bài thi theo ID
exports.getEnglishExamById = async (req, res) => {
    try {
        const { id } = req.params;

        const englishExam = await EnglishExam.findById(id).populate("user_id", "_id displayName profilePicture").lean();

        if (!englishExam) {
            return res.status(404).json({ message: "Không tìm thấy bài thi" });
        }

        res.status(200).json({ ok: true, englishExam });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

// Tạo bài thi mới
exports.createEnglishExam = async (req, res) => {
    try {
        const { id } = req.user;
        const examData = req.body;
        // Generate unique question_ids for each question
        examData.questions = examData.questions.map((question) => ({
            ...question,
            question_id: question.question_id || uuidv4(),
        }));

        // Generate share_link if exam is published
        if (examData.is_published) {
            examData.share_link = `exam-${uuidv4()}`;
        }

        const newExam = new EnglishExam({
            ...examData,
            user_id: id,
        });

        await newExam.save();
        await handleCreateActivity(id, "create", "englishExam", newExam._id);

        res.status(201).json({
            ok: true,
            message: "Tạo bài thi thành công",
            englishExam: newExam,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi khi tạo bài thi", error: error.message });
    }
};

// Cập nhật bài thi
exports.updateEnglishExam = async (req, res) => {
    try {
        const { id } = req.params;
        const { id: userId } = req.user;
        const updateData = req.body;

        const existingExam = await EnglishExam.findById(id);
        if (!existingExam) {
            return res.status(404).json({ message: "Không tìm thấy bài thi" });
        }

        // Check ownership
        if (existingExam.user_id.toString() !== userId) {
            return res.status(403).json({ message: "Không có quyền chỉnh sửa bài thi này" });
        }

        // Generate share_link if changing to published
        if (updateData.is_published && !existingExam.share_link) {
            updateData.share_link = `exam-${uuidv4()}`;
        }

        // Update question_ids if new questions added
        if (updateData.questions) {
            updateData.questions = updateData.questions.map((question) => ({
                ...question,
                question_id: question.question_id || uuidv4(),
            }));
        }

        updateData.updated_at = new Date();

        const updatedExam = await EnglishExam.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate("user_id", "_id displayName profilePicture");

        await handleCreateActivity(userId, "update", "englishExam", id);

        res.status(200).json({
            ok: true,
            message: "Cập nhật bài thi thành công",
            englishExam: updatedExam,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi khi cập nhật bài thi", error: error.message });
    }
};

// Xóa bài thi
exports.deleteEnglishExam = async (req, res) => {
    try {
        const { id } = req.params;
        const { id: userId } = req.user;

        const existingExam = await EnglishExam.findById(id);
        if (!existingExam) {
            return res.status(404).json({ message: "Không tìm thấy bài thi" });
        }

        // Check ownership
        if (existingExam.user_id.toString() !== userId) {
            return res.status(403).json({ message: "Không có quyền xóa bài thi này" });
        }

        // Delete related exam results
        await EnglishExamResult.deleteMany({ exam_id: id });

        await EnglishExam.findByIdAndDelete(id);
        await handleCreateActivity(userId, "delete", "englishExam", id);

        res.status(200).json({
            ok: true,
            message: "Xóa bài thi thành công",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi khi xóa bài thi", error: error.message });
    }
};

// Lấy bài thi theo share_link
exports.getExamByShareLink = async (req, res) => {
    try {
        const { shareLink } = req.params;

        const exam = await EnglishExam.findOne({
            share_link: shareLink,
            is_published: true,
        })
            .populate("user_id", "_id displayName profilePicture")
            .lean();

        if (!exam) {
            return res.status(404).json({ message: "Không tìm thấy bài thi hoặc bài thi chưa được xuất bản" });
        }

        res.status(200).json({ ok: true, englishExam: exam });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

// Nộp bài thi và lưu kết quả
exports.submitExamResult = async (req, res) => {
    try {
        const { examId } = req.params;
        const { id: userId } = req.user;
        const { answers, time_taken_minutes } = req.body;

        const exam = await EnglishExam.findById(examId);
        if (!exam) {
            return res.status(404).json({ message: "Không tìm thấy bài thi" });
        }

        // Check if user already submitted this exam
        const existingResult = await EnglishExamResult.findOne({
            exam_id: examId,
            user_id: userId,
        });

        if (existingResult) {
            return res.status(400).json({ message: "Bạn đã làm bài thi này rồi" });
        }

        const gradingResults = [];
        const processedAnswers = [];

        // Auto-grade answers using ExamGradingService
        for (const answer of answers) {
            const question = exam.questions.find((q) => q.question_id === answer.question_id);
            if (!question) continue;

            const gradingResult = ExamGradingService.gradeAnswer(question, answer.user_answer);
            gradingResults.push(gradingResult);

            processedAnswers.push({
                question_id: answer.question_id,
                user_answer: answer.user_answer,
                is_correct: gradingResult.isCorrect,
                score_obtained: gradingResult.scoreObtained,
                feedback: gradingResult.feedback,
            });
        }

        const totalScore = ExamGradingService.calculateTotalScore(gradingResults);

        // Generate detailed report
        const detailedReport = ExamGradingService.generateDetailedReport(exam, answers, gradingResults);

        // Save exam result
        const examResult = new EnglishExamResult({
            exam_id: examId,
            user_id: userId,
            total_score_achieved: totalScore,
            time_taken_minutes,
            answers: processedAnswers,
        });

        await examResult.save();
        await handleCreateActivity(userId, "complete", "englishExam", examId);

        res.status(201).json({
            ok: true,
            message: "Nộp bài thành công",
            result: {
                resultId: examResult._id,
                total_score_achieved: totalScore,
                total_possible_score: exam.total_score,
                percentage: detailedReport.performance.percentage,
                time_taken_minutes,
                detailedReport,
                answers: processedAnswers,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi khi nộp bài thi", error: error.message });
    }
};

// Lấy kết quả bài thi của user
exports.getUserExamResults = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const results = await EnglishExamResult.find({ user_id: userId })
            .populate({
                path: "exam_id",
                select: "exam_title difficulty_level total_score",
                populate: {
                    path: "user_id",
                    select: "_id displayName",
                },
            })
            .sort({ submitted_at: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();

        const total = await EnglishExamResult.countDocuments({ user_id: userId });

        res.status(200).json({
            ok: true,
            results,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

// Lấy chi tiết kết quả bài thi
exports.getExamResultDetail = async (req, res) => {
    try {
        const { resultId } = req.params;
        const { id: userId } = req.user;

        const result = await EnglishExamResult.findOne({
            _id: resultId,
            user_id: userId,
        })
            .populate({
                path: "exam_id",
                populate: {
                    path: "user_id",
                    select: "_id displayName",
                },
            })
            .lean();

        if (!result) {
            return res.status(404).json({ message: "Không tìm thấy kết quả bài thi" });
        }

        res.status(200).json({ ok: true, result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

// Lấy thống kê bài thi cho admin/teacher
exports.getExamStatistics = async (req, res) => {
    try {
        const { examId } = req.params;
        const { id: userId } = req.user;

        const exam = await EnglishExam.findById(examId);
        if (!exam) {
            return res.status(404).json({ message: "Không tìm thấy bài thi" });
        }

        // Check ownership
        if (exam.user_id.toString() !== userId) {
            return res.status(403).json({ message: "Không có quyền xem thống kê bài thi này" });
        }

        const stats = await EnglishExamResult.aggregate([
            { $match: { exam_id: exam._id } },
            {
                $group: {
                    _id: null,
                    totalAttempts: { $sum: 1 },
                    averageScore: { $avg: "$total_score_achieved" },
                    maxScore: { $max: "$total_score_achieved" },
                    minScore: { $min: "$total_score_achieved" },
                    averageTime: { $avg: "$time_taken_minutes" },
                },
            },
        ]);

        const recentResults = await EnglishExamResult.find({ exam_id: examId }).populate("user_id", "_id displayName profilePicture").sort({ submitted_at: -1 }).limit(10).lean();

        res.status(200).json({
            ok: true,
            statistics: stats[0] || {
                totalAttempts: 0,
                averageScore: 0,
                maxScore: 0,
                minScore: 0,
                averageTime: 0,
            },
            recentResults,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

// Lấy bài thi của user (của chính mình tạo)
exports.getMyExams = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { page = 1, limit = 10, is_published } = req.query;
        const skip = (page - 1) * limit;

        const filter = { user_id: userId };
        if (is_published !== undefined) {
            filter.is_published = is_published === "true";
        }

        const exams = await EnglishExam.find(filter).sort({ created_at: -1 }).skip(skip).limit(Number(limit)).lean();

        const total = await EnglishExam.countDocuments(filter);

        // Add statistics for each exam
        const examsWithStats = await Promise.all(
            exams.map(async (exam) => {
                const resultCount = await EnglishExamResult.countDocuments({ exam_id: exam._id });
                return {
                    ...exam,
                    totalAttempts: resultCount,
                };
            })
        );

        res.status(200).json({
            ok: true,
            exams: examsWithStats,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

// Clone/Duplicate bài thi
exports.cloneExam = async (req, res) => {
    try {
        const { id: examId } = req.params;
        const { id: userId } = req.user;

        const originalExam = await EnglishExam.findById(examId);
        if (!originalExam) {
            return res.status(404).json({ message: "Không tìm thấy bài thi" });
        }

        // Create new exam with cloned data
        const clonedExam = new EnglishExam({
            user_id: userId,
            exam_title: `${originalExam.exam_title} (Copy)`,
            exam_description: originalExam.exam_description,
            difficulty_level: originalExam.difficulty_level,
            target_skills: originalExam.target_skills,
            estimated_time_minutes: originalExam.estimated_time_minutes,
            total_score: originalExam.total_score,
            questions: originalExam.questions.map((question) => ({
                ...question.toObject(),
                question_id: uuidv4(), // Generate new question IDs
            })),
            is_published: false, // Always start as draft
        });

        await clonedExam.save();
        await handleCreateActivity(userId, "create", "englishExam", clonedExam._id);

        res.status(201).json({
            ok: true,
            message: "Sao chép bài thi thành công",
            englishExam: clonedExam,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi khi sao chép bài thi", error: error.message });
    }
};

// Manual grading for subjective questions
exports.manualGrading = async (req, res) => {
    try {
        const { resultId } = req.params;
        const { id: userId } = req.user;
        const { questionId, score, feedback } = req.body;

        const examResult = await EnglishExamResult.findById(resultId).populate("exam_id");

        if (!examResult) {
            return res.status(404).json({ message: "Không tìm thấy kết quả bài thi" });
        }

        // Check if user owns the exam
        if (examResult.exam_id.user_id.toString() !== userId) {
            return res.status(403).json({ message: "Không có quyền chấm điểm bài thi này" });
        }

        // Find and update the specific answer
        const answerIndex = examResult.answers.findIndex((answer) => answer.question_id === questionId);

        if (answerIndex === -1) {
            return res.status(404).json({ message: "Không tìm thấy câu trả lời" });
        }

        const question = examResult.exam_id.questions.find((q) => q.question_id === questionId);
        const maxScore = question ? question.score_points : 1;

        if (score > maxScore) {
            return res.status(400).json({ message: `Điểm không được vượt quá ${maxScore}` });
        }

        // Update the answer
        examResult.answers[answerIndex].score_obtained = score;
        examResult.answers[answerIndex].feedback = feedback;
        examResult.answers[answerIndex].is_correct = score > 0;

        // Recalculate total score
        examResult.total_score_achieved = examResult.answers.reduce((total, answer) => total + (answer.score_obtained || 0), 0);

        await examResult.save();

        res.status(200).json({
            ok: true,
            message: "Chấm điểm thành công",
            examResult,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi khi chấm điểm", error: error.message });
    }
};
