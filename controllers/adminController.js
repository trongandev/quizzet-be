const { default: slugify } = require("slugify");
const { SOModel, DataSOModel } = require("../models/SO");
const generateRandomSlug = require("../services/random-slug");
const { QuizModel } = require("../models/Quiz");
const { FlashCard, ListFlashCard } = require("../models/FlashCard");
const Report = require("../models/Report");
const User = require("../models/User");
const addSubOutline = async (req, res) => {
    try {
        const { title, image, quest } = req.body;
        const { id } = req.user;
        if (!title || !quest || !image) {
            return res.status(400).json({ message: "Vui lòng điền đẩy đủ" });
        }

        const newDataSO = new DataSOModel({
            data_so: quest,
        });
        const saveDataSO = await newDataSO.save();
        const newSO = new SOModel({
            user_id: id,
            version: 2,
            slug: slugify(title, { lower: true }) + "-" + generateRandomSlug(),
            title,
            image,
            lenght: quest.length,
            quest: saveDataSO._id,
            date: Date.now(),
        });

        await newSO.save();
        res.status(201).json({ message: "Thêm thành công" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const getSubOutline = async (req, res) => {
    try {
        const subOutline = await SOModel.find().sort({ date: -1 });
        res.status(200).json(subOutline);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const getSubOutlineById = async (req, res) => {
    try {
        const { id } = req.params;
        const subOutline = await SOModel.findOne({ _id: id }).populate("quest", "data_so");
        if (!subOutline) {
            return res.status(404).json({ message: "Không tìm thấy", ok: false });
        }
        res.status(200).json(subOutline);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const getSubOutlineBySlug = async (req, res) => {
    try {
        const { id } = req.params;
        const subOutline = await SOModel.findOne({ slug: id }).populate("quest", "data_so");
        if (!subOutline) {
            return res.status(404).json({ message: "Không tìm thấy", ok: false });
        }
        res.status(200).json(subOutline);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const updateSO = async (req, res) => {
    try {
        const { id, image, quest, so_id, lenght, title } = req.body;
        const updateFields = {};
        if (image !== undefined) updateFields.image = image;
        if (lenght !== undefined) updateFields.lenght = lenght;
        if (title !== undefined) updateFields.title = title;
        updateFields.slug = slugify(title, { lower: true }) + "-" + generateRandomSlug();
        const update_profile = await SOModel.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
        const update_quest = await DataSOModel.findByIdAndUpdate(so_id, { $set: { data_so: quest } }, { new: true });
        if (!update_profile || !update_quest) {
            return res.status(400).json({ message: "Cập nhật thông tin không thành công" });
        }
        return res.status(200).json({ ok: true, message: "Cập nhật thành công", update_profile });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const updateViewSO = async (req, res) => {
    try {
        const { id } = req.params;
        const so = await SOModel.findOne({ _id: id });
        if (!so) {
            return res.status(404).json({ message: "Không tìm thấy", ok: false });
        }
        const update = await SOModel.findByIdAndUpdate(id, { $set: { view: so.view + 1 } }, { new: true });
        res.status(200).json({ ok: true, update });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const deleteSubOutline = async (req, res) => {
    try {
        const { id } = req.body;
        await SOModel.findByIdAndDelete(id);
        res.status(200).json({ message: "Xóa thành công" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const analysticAll = async (req, res) => {
    try {
        const subOutline = await SOModel.find();
        const quiz = await QuizModel.find();
        const flashcard = await FlashCard.find();
        const listFlashcard = await ListFlashCard.find();
        const report = await Report.find();
        const user = await User.find();
        // Tạo data cho biểu đồ người dùng đăng ký theo ngày
        const userRegistrationData = {};
        user.forEach((u) => {
            const month = new Date(u.created_at).getMonth(); // Lấy ngày đăng ký
            userRegistrationData[month] = (userRegistrationData[month] || 0) + 1;
        });

        const chartData = Object.entries(userRegistrationData)
            .map(([month, count]) => ({
                month,
                count,
            }))
            .sort((a, b) => new Date(a.month) - new Date(b.month));
        const data = {
            subOutline: subOutline.length,
            quiz: quiz.length,
            flashcard: flashcard.length,
            listFlashcard: listFlashcard.length,
            report: report.length,
            user: user.length,
            chartData,
        };
        res.status(200).json(data);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

module.exports = {
    addSubOutline,
    getSubOutline,
    getSubOutlineById,
    getSubOutlineBySlug,
    updateSO,
    updateViewSO,
    deleteSubOutline,
    analysticAll,
};
