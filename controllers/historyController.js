const { HistoryModel, DataHistoryModel } = require("../models/History");
const { DataQuizModel, QuizModel } = require("../models/Quiz");

const UserModel = require("../models/User");

const getHistory = async (req, res) => {
    try {
        const { id } = req.user;
        const history = await HistoryModel.find({ user_id: id }).populate("questions", "data_history").sort({ date: -1 });
        if (!history) {
            return res.status(404).json({ message: "Không tìm thấy history", ok: false });
        }
        res.status(200).json({ history, ok: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const getAllHistory = async (req, res) => {
    try {
        const history = await HistoryModel.find().populate("quiz_id").populate("user_id", "profilePicture displayName").sort({ date: -1 });
        res.status(200).json({ ok: true, history });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const getHistoryById = async (req, res) => {
    try {
        const { _id } = req.params;
        const history = await HistoryModel.findOne({ _id }).populate("quiz_id", "_id title content").populate("questions");

        res.status(200).json({ history });
    } catch (error) {
        console.log(error);
        res.status(404).json({ message: "Không tìm thấy history", status: 404 });
    }
};

const createHistory = async (req, res) => {
    try {
        const { quiz_id, time, score, questions } = req.body;
        const { id } = req.user;
        const quiz = await QuizModel.findById(quiz_id);
        if (quiz) {
            quiz.noa++;
            await quiz.save();
        }
        const newDataHistory = new DataHistoryModel({
            data_history: questions,
        });

        const saveDataHistory = await newDataHistory.save();
        // Tạo đối tượng Quiz mới từ thông tin gửi lên
        const newHistory = new HistoryModel({
            user_id: id,
            quiz_id,
            time,
            score,
            questions: saveDataHistory._id,
        });

        // Lưu đối tượng vào database
        const saveHistory = await newHistory.save();

        // Trả về response
        res.status(201).json({ ok: true, message: "Gửi bài thành công", id_history: saveHistory._id });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

module.exports = {
    getHistory,
    getAllHistory,
    getHistoryById,
    createHistory,
};
