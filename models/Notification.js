const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Người nhận thông báo
        required: true,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Người gửi thông báo (nếu có)
    },
    type: {
        type: String, // Loại thông báo
        enum: ["message", "comment", "system", "approve", "reject", "report"], // Loại thông báo: tin nhắn, bình luận, hệ thống
        required: true,
    },
    link: {
        type: String, // Đường dẫn tới trang cần đến khi click vào thông báo
    },
    content: {
        type: String, // Nội dung thông báo
        required: true,
        trim: true,
    },
    is_read: {
        type: Boolean, // Trạng thái đã đọc hay chưa
        default: false,
    },
    created_at: {
        type: Date, // Thời gian tạo thông báo
        default: Date.now,
    },
    updated_at: {
        type: Date, // Thời gian cập nhật thông báo (nếu có)
    },
});

module.exports = mongoose.model("Notification", NotificationSchema);
