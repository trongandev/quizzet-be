const mongoose = require("mongoose");

const NoticeSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true, // Loại bỏ khoảng trắng thừa ở đầu/cuối
    },
    content: {
        type: String,
    },
    image: String,
    link: String,
    status: {
        type: Boolean,
        default: true,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Notice", NoticeSchema);
