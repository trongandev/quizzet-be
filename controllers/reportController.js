const Report = require("../models/Report");

// lấy tất cả báo cáo
const GetAll = async (req, res) => {
    try {
        const result = await Report.find().populate("user_report", "_id profilePicture displayName").populate("resolved_by", "_id profilePicture displayName").sort({ created_at: -1 });
        res.status(200).json({ ok: true, result });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const GetbyId = async (req, res) => {
    try {
        const { id } = req.body;
        const result = await Report.findById({ id });
        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};
const Notification = require("../models/Notification");

const Create = async (req, res) => {
    try {
        const { type_of_violation, link, content } = req.body;
        const { id } = req.user;
        if (!content) {
            return res.status(400).json({ message: "Vui lòng nhập nội dung..." });
        }

        const newReport = new Report({
            user_report: id,
            type_of_violation,
            link,
            content,
        });

        const newNotification = new Notification({
            recipient: id,
            sender: id,
            type: "report",
            link,
            content: "Gửi báo cáo thành công, vui lòng chờ admin xem xét",
        });

        await newNotification.save();

        await newReport.save();
        res.status(201).json({ ok: true, message: "Gửi báo cáo thành công, vui lòng chờ admin xem xét" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};
// cập nhật báo cáo khi đã xử lí
const Update = async (req, res) => {
    try {
        const { _id } = req.params;
        const { is_violated, resolved_content } = req.body;
        const { id } = req.user;

        const find = await Report.findById(_id);
        if (!find) {
            return res.status(404).json({ message: "Không tìm thấy báo cáo để cập nhật", status: 404 });
        }

        find.status = "resolved";
        find.is_violated = is_violated;
        find.resolved_content = resolved_content;
        find.resolved_date = new Date();
        find.resolved_by = id;
        await find.save();
        const result = await Report.findById(_id).populate("user_report", "_id profilePicture displayName").populate("resolved_by", "_id profilePicture displayName");

        res.status(200).json({ ok: true, message: "Cập nhật báo cáo thành công", result });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

module.exports = {
    GetAll,
    GetbyId,
    Create,
    Update,
};
