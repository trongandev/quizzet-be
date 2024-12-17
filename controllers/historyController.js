const { HistoryModel, DataHistoryModel } = require("../models/History");
const UserModel = require("../models/User");

const getHistory = async (req, res) => {
    try {
        const { id } = req.user;
        const history = await HistoryModel.find({ uid: id }).sort({ date: -1 });
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
        const history = await HistoryModel.find().populate("uid", "profilePicture displayName").sort({ date: -1 });
        res.status(200).json({ ok: true, history });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const getHistoryById = async (req, res) => {
    try {
        const { _id } = req.params;
        const history = await HistoryModel.findOne({ _id }).populate("questions");

        res.status(200).json({ history });
    } catch (error) {
        console.log(error);
        res.status(404).json({ message: "Không tìm thấy history", status: 404 });
    }
};

const createHistory = async (req, res) => {
    try {
        const { uid, id_quiz, title, content, image_quiz, score, questions } = req.body;
        const { id } = req.user;
        console.log(uid, req.user);
        if (uid === "") return res.status(400).json({ message: "Server chưa nhận được UID từ bạn, vui lòng đăng nhập lại" });
        if (id !== uid) return res.status(400).json({ message: "Vui lòng đăng nhập lại" });
        if (title === "") return res.status(400).json({ message: "Vui lòng nhập tiêu đề" });
        if (content === "") return res.status(400).json({ message: "Vui lòng nhập nội dung" });

        const newDataHistory = new DataHistoryModel({
            data_history: questions,
        });

        const saveDataHistory = await newDataHistory.save();
        // Tạo đối tượng Quiz mới từ thông tin gửi lên
        const newHistory = new HistoryModel({
            uid,
            id_quiz,
            title,
            content,
            image_quiz,
            date: new Date(), // Chuyển timestamp thành Date
            score,
            lenght: questions.length,
            questions: saveDataHistory._id,
        });

        // Lưu đối tượng vào database
        const saveHistory = await newHistory.save();

        // Trả về response
        res.status(201).json({ message: "Tạo Quiz thành công", id_history: saveHistory._id });
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
