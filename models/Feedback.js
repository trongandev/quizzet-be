const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true, // Loại bỏ khoảng trắng thừa ở đầu/cuối
        },
        comment: {
            type: String,
            required: true,
            trim: true, // Loại bỏ khoảng trắng thừa ở đầu/cuối
        },
        category: {
            type: String,
            enum: ["Giao diện", "Tính năng", "Nội dung", "Hiệu suất", "Cộng đồng"],
            required: true,
        },
        rating: {
            type: Number,
            min: 1, // Giới hạn sao từ 1 đến 5
            max: 5,
            required: true,
        },
        likes: {
            type: Number,
            default: 0, // Số lượt thích ban đầu là 0
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Feedback", FeedbackSchema);
