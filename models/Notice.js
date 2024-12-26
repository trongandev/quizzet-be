const mongoose = require("mongoose");

const NoticeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true, // Bắt buộc phải có tiêu đề
        trim: true, // Loại bỏ khoảng trắng thừa ở đầu/cuối
    },
    content: {
        type: String,
        required: true, // Bắt buộc phải có nội dung
    },
    image: String,
    link: String,
    status: {
        type: Boolean,
        default: true,
    },
    created_at: {
        type: Date,
        default: new Date(),
    },
});

module.exports = mongoose.model("Notice", NoticeSchema);
