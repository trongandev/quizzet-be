const { SOModel, DataSOModel } = require("../models/SO");

const addSubOutline = async (req, res) => {
    try {
        const { slug, title, image, quest } = req.body;
        if (!slug || !title || !quest || !image) {
            return res.status(400).json({ message: "Vui lòng điền đẩy đủ" });
        }

        const newDataSO = new DataSOModel({
            data_so: quest,
        });
        const saveDataSO = await newDataSO.save();

        const newSO = new SOModel({
            slug,
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
        const subOutline = await SOModel.find({ subject: id });
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

module.exports = {
    addSubOutline,
    getSubOutline,
    getSubOutlineById,
    getSubOutlineBySlug,
    deleteSubOutline,
};
