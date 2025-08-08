const Feedback = require("../models/Feedback");

const Get = async (req, res) => {
    try {
        const result = await Feedback.find()
            .populate([
                {
                    path: "user_id",
                    select: "_id displayName profilePicture role gamification",
                    populate: {
                        path: "gamification",
                        select: "level xp dailyStreak",
                    },
                },
            ])
            .sort({ createdAt: -1 });
        console.log(result);
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const Create = async (req, res) => {
    try {
        const { title, comment, rating, category } = req.body;
        const { id } = req.user;
        const find = await Feedback.findOne({ user_id: id });
        if (find) {
            return res.status(400).json({ message: "Bạn đã đánh giá trước đó rồi" });
        }
        const findFeedback = new Feedback({
            user_id: id,
            title,
            comment,
            rating,
            category,
        });
        await findFeedback.save();
        const getOneFeedback = await Feedback.findOne({ _id: findFeedback._id })
            .populate([
                {
                    path: "user_id",
                    select: "_id displayName profilePicture role gamification",
                    populate: {
                        path: "gamification",
                        select: "level xp dailyStreak",
                    },
                },
            ])
            .sort({ createdAt: -1 });
        res.status(201).json({ message: "Thêm thành công", getOneFeedback, ok: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const Update = async (req, res) => {
    try {
        const { _id } = req.params; // Lấy id từ URL
        const updateFields = {}; // Tạo đối tượng rỗng để chứa các trường cần cập nhật

        // Kiểm tra từng trường trong req.body và chỉ thêm vào các trường không undefined
        if (req.body.title !== undefined) updateFields.title = req.body.title;
        if (req.body.comment !== undefined) updateFields.comment = req.body.comment;
        if (req.body.rating !== undefined) updateFields.rating = req.body.rating;
        if (req.body.category !== undefined) updateFields.category = req.body.category;
        if (req.body.likes !== undefined) updateFields.likes = req.body.likes; // Tăng likes lên 1 nếu có trường likes trong body

        // Tìm và cập nhật quiz
        const updateData = await Feedback.findByIdAndUpdate(
            _id,
            {
                $set: updateFields, // Chỉ cập nhật các trường được gửi trong request
            },
            { new: true } // Trả về quiz đã được cập nhật
        );

        if (!updateData) {
            return res.status(404).json({ message: "Không tìm thấy để cập nhật", status: 404 });
        }
        await updateData.save(); // Lưu lại thay đổi

        res.status(200).json({ message: "Cập nhật thành công", updateData, ok: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const Delete = async (req, res) => {
    try {
        const { id } = req.user;
        const { _id } = req.body;
        const find = await Feedback.findById(_id);
        if (!find) {
            return res.status(404).json({ message: "Không tìm thấy phản hồi để xóa" });
        }
        if (find.user_id.toString() !== id.toString()) {
            return res.status(403).json({ message: "Bạn không có quyền xóa phản hồi này" });
        }
        await Feedback.deleteOne(_id);
        res.status(200).json({ message: "Xóa thành công", ok: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

module.exports = {
    Get,
    Create,
    Update,
    Delete,
};
