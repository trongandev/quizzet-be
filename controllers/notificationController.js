const Notification = require("../models/Notification");

// Tạo thông báo mới
exports.createNotification = async (req, res) => {
    try {
        const { recipient, sender, type, link, content } = req.body;

        if (!recipient || !type || !content) {
            return res.status(400).json({ message: "Thông tin không đầy đủ" });
        }

        const newNotification = new Notification({
            recipient,
            sender,
            type,
            link,
            content,
        });

        await newNotification.save();
        res.status(201).json({ message: "Thông báo được tạo thành công", notification: newNotification });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau" });
    }
};

// Lấy danh sách thông báo của người dùng
exports.getUserNotifications = async (req, res) => {
    try {
        const { id } = req.user;

        const notifications = await Notification.find({ recipient: id }).populate("sender", "_id profilePicture displayName").sort({ created_at: -1 }).exec();

        // Đếm số lượng thông báo chưa đọc
        const unreadCount = await Notification.countDocuments({
            recipient: id,
            is_read: false,
        });

        res.status(200).json({ message: "Lấy thông báo thành công", notifications, unreadCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau" });
    }
};

// Đánh dấu thông báo là đã đọc
exports.markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const { id } = req.user;

        const notification = await Notification.findByIdAndUpdate(notificationId, { is_read: true }, { new: true });

        if (!notification) {
            return res.status(404).json({ message: "Thông báo không tồn tại" });
        }

        // Đếm số lượng thông báo chưa đọc
        const unreadCount = await Notification.countDocuments({
            recipient: id,
            is_read: false,
        });

        res.status(200).json({ ok: true, message: "Đánh dấu thông báo là đã đọc", unreadCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau" });
    }
};

// Xóa thông báo
exports.deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;

        const notification = await Notification.findByIdAndDelete(notificationId);

        if (!notification) {
            return res.status(404).json({ message: "Thông báo không tồn tại" });
        }

        res.status(200).json({ message: "Xóa thông báo thành công" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau" });
    }
};
