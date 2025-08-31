const { default: slugify } = require("slugify");
const { SOModel, DataSOModel } = require("../models/SO");
const generateRandomSlug = require("../services/random-slug");
const addSubOutline = async (req, res) => {
    try {
        const { title, content, image, type, link, quest, file_size } = req.body;
        const { id } = req.user;
        if (!title) {
            return res.status(400).json({ message: "Vui lòng điền đẩy đủ" });
        }
        if (quest) {
            const newDataSO = new DataSOModel({
                data_so: quest,
            });
            const saveDataSO = await newDataSO.save();
            const newSO = new SOModel({
                user_id: id,
                version: 2,
                slug: slugify(title, { lower: true }) + "-" + generateRandomSlug(),
                title,
                content,
                type: "txt",
                image,
                lenght: quest.length,
                quest: saveDataSO._id,
                date: Date.now(),
            });

            await newSO.save();
            res.status(201).json({ ok: true, message: "Thêm thành công" });
        } else {
            const newSO = new SOModel({
                user_id: id,
                version: 2,
                slug: slugify(title, { lower: true }) + "-" + generateRandomSlug(),
                title,
                content,
                type,
                link,
                lenght: file_size,
                date: Date.now(),
            });

            await newSO.save();
            res.status(201).json({ ok: true, link: newSO.slug, message: "Thêm thành công" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const getSubOutline = async (req, res) => {
    try {
        const findText = await SOModel.find({ type: "txt" }).populate("quest", "data_so").populate("user_id", "_id displayName profilePicture").sort({ date: -1 });
        const findFile = await SOModel.find({ type: { $ne: "txt" } })
            .populate("user_id", "_id displayName profilePicture")
            .sort({ date: -1 });
        res.status(200).json({ findText, findFile });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const getSubOutlineAdmin = async (req, res) => {
    try {
        const findText = await SOModel.find().populate("quest", "data_so").populate("user_id", "_id displayName profilePicture").sort({ date: -1 }).exec();
        return res.status(200).json({ ok: true, findText });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const getSubOutlineByUser = async (req, res) => {
    try {
        const { id } = req.user;
        const subOutline = await SOModel.find({ user_id: id }).populate("user_id", "_id displayName profilePicture").sort({ date: -1 });
        if (!subOutline) {
            return res.status(404).json({ message: "Không tìm thấy", ok: false });
        }
        res.status(200).json(subOutline);
    } catch (error) {
        console.error(error);
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
        console.error(error);
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
        console.error(error);
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
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const deleteSubOutline = async (req, res) => {
    try {
        const { id } = req.body;
        await SOModel.findByIdAndDelete(id);
        res.status(200).json({ message: "Xóa thành công" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

module.exports = {
    addSubOutline,
    getSubOutlineAdmin,
    getSubOutline,
    getSubOutlineByUser,
    getSubOutlineBySlug,
    updateSO,
    updateViewSO,
    deleteSubOutline,
};
