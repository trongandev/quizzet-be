const Notice = require("../models/Notice");

const Get = async (req, res) => {
    try {
        const notice = await Notice.find().sort({ created_at: -1 });
        res.status(200).json({ ok: true, notice });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const GetPublic = async (req, res) => {
    try {
        const notice = await Notice.find({ status: true });
        res.status(200).json({ ok: true, notice });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};
const GetbyId = async (req, res) => {
    try {
        const { id } = req.body;
        const subOutline = await Notice.findById({ id });
        res.status(200).json(subOutline);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const Create = async (req, res) => {
    try {
        const { title, content, image, link } = req.body;

        const newSO = new Notice({
            title,
            content,
            image,
            link,
            created_at: new Date(),
        });

        await newSO.save();
        res.status(201).json({ message: "Thêm thành công", notice: newSO });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const Update = async (req, res) => {
    try {
        const { id } = req.params; // Lấy id từ URL

        const updateFields = {}; // Tạo đối tượng rỗng để chứa các trường cần cập nhật

        // Kiểm tra từng trường trong req.body và chỉ thêm vào các trường không undefined
        if (req.body.title !== undefined) updateFields.title = req.body.title;
        if (req.body.content !== undefined) updateFields.content = req.body.content;
        if (req.body.image !== undefined) updateFields.image = req.body.image;
        if (req.body.link !== undefined) updateFields.link = req.body.link;
        if (req.body.status !== undefined) updateFields.status = req.body.status;
        else updateFields.status = false;

        // Tìm và cập nhật quiz
        const updatedQuiz = await Notice.findByIdAndUpdate(
            id,
            {
                $set: updateFields, // Chỉ cập nhật các trường được gửi trong request
            },
            { new: true } // Trả về quiz đã được cập nhật
        );

        if (!updatedQuiz) {
            return res.status(404).json({ message: "Không tìm thấy để cập nhật", status: 404 });
        }

        res.status(200).json({ message: "Cập nhật thành công", updatedQuiz });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const Delete = async (req, res) => {
    try {
        const { id } = req.body;
        await Notice.findByIdAndDelete(id);
        res.status(200).json({ ok: true, message: "Xóa thành công" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

module.exports = {
    Get,
    GetPublic,
    GetbyId,
    Create,
    Update,
    Delete,
};
