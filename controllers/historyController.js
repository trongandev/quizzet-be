const HistoryModel = require("../models/History");
const { DataQuizModel, QuizModel } = require("../models/Quiz");

const UserModel = require("../models/User");

const getHistory = async (req, res) => {
    try {
        const { id } = req.user;
        const history = await HistoryModel.find({ user_id: id }).populate("quiz_id", "title subject").sort({ date: -1 });
        if (!history) {
            return res.status(404).json({ message: "Không tìm thấy history", ok: false });
        }
        res.status(200).json({ history, ok: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const getAllHistory = async (req, res) => {
    try {
        const history = await HistoryModel.find().populate("quiz_id", "title subject").populate("user_id", "profilePicture displayName").sort({ date: -1 }).exec();
        res.status(200).json({ ok: true, history });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const getHistoryById = async (req, res) => {
    try {
        const { _id } = req.params;
        const history = await HistoryModel.findOne({ _id }).populate("quiz_id", "_id title subject questions").populate("user_id", "profilePicture displayName");
        const question = await QuizModel.findById(history.quiz_id._id).populate("questions", "data_quiz");

        res.status(200).json({ history, question: question.questions.data_quiz });
    } catch (error) {
        console.error(error);
        res.status(404).json({ message: "Không tìm thấy history", status: 404 });
    }
};

const createHistory = async (req, res) => {
    try {
        const { quiz_id, time, score, userAnswers, total_questions } = req.body;
        const { id } = req.user;

        // Validate quiz existence
        const quiz = await QuizModel.findById(quiz_id);
        if (!quiz) {
            return res.status(404).json({
                message: "Không tìm thấy quiz",
                ok: false,
            });
        }

        // Update quiz attempts
        quiz.noa = (quiz.noa || 0) + 1;
        await quiz.save();

        // Create history entry
        const newHistory = new HistoryModel({
            user_id: id,
            quiz_id,
            time,
            total_questions,
            score,
            userAnswers: userAnswers,
        });

        await newHistory.save();

        return res.status(201).json({
            ok: true,
            message: "Gửi bài thành công",
            id_history: newHistory._id.toString(),
        });
    } catch (error) {
        console.error("Create History Error:", error);
        return res.status(500).json({
            message: "Server gặp lỗi, vui lòng thử lại sau ít phút",
            error: error.message,
        });
    }
};

module.exports = {
    getHistory,
    getAllHistory,
    getHistoryById,
    createHistory,
};
