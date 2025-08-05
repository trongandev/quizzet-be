const mongoose = require("mongoose");

const FlashCardSchema = new mongoose.Schema({
    userId: {
        // Thêm trường userId để liên kết thẻ với người dùng
        type: String,
        required: true,
        index: true, // Tạo index để tăng hiệu suất truy vấn theo userId
    },
    title: {
        type: String,
        required: true, // Bắt buộc phải có tiêu đề
        trim: true, // Loại bỏ khoảng trắng thừa ở đầu/cuối
    },
    define: {
        type: String,
        required: true, // Bắt buộc phải có định nghĩa
    },
    language: {
        type: String,
        required: true, // Bắt buộc phải có ngôn ngữ
        enum: ["english", "japan", "korea", "france", "germany", "chinese"], // Giới hạn các ngôn ngữ hỗ trợ
    },
    type_of_word: String,
    transcription: String, // Phiên âm
    example: [
        {
            en: String,
            trans: String,
            vi: String,
        },
    ],
    note: String,
    // Các trường của thuật toán SM-2 (được thêm vào)
    efactor: { type: Number, default: 2.5 }, // Hệ số dễ dàng
    interval: { type: Number, default: 0 }, // Khoảng thời gian (số ngày)
    repetitions: { type: Number, default: 0 }, // Số lần lặp lại thành công
    nextReviewDate: { type: Date, default: Date.now, index: true }, // Ngày ôn tập tiếp theo
    status: {
        type: String,
        enum: ["learned", "remembered", "reviewing"], // Các trạng thái của từ
        default: "reviewing", // Mặc định là cần ôn tập
    },
    level: {
        type: String,
    },
    progress: {
        learnedTimes: {
            type: Number,
            default: 0, // Số lần đã học từ
        },
        percentage: {
            type: Number,
            default: 0, // % thuộc của từ
        },
    },
    history: [
        {
            date: {
                type: Date,
                default: Date.now,
            },
            quality: {
                // Thay đổi từ 'result: Boolean' sang 'quality: Number' (0-5)
                type: Number,
                required: true,
            },
        },
    ],
    created_at: {
        type: Date,
        default: Date.now,
    },
});
// Index kết hợp cho hiệu suất truy vấn
FlashCardSchema.index({ userId: 1, nextReviewDate: 1 });
const ListFlashCardSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true, // Tạo index để tăng hiệu suất truy vấn theo userId
    },
    title: {
        type: String,
        required: true, // Bắt buộc phải có tiêu đề
        trim: true, // Loại bỏ khoảng trắng thừa ở đầu/cuối
    },
    language: String,
    desc: String,
    public: {
        type: Boolean,
        default: false, // Mặc định là riêng tư (false)
    },
    isSuccess: {
        type: Boolean,
        default: false, // Mặc định là chưa hoàn thành
    },
    isHiddenTranscription: {
        type: Boolean,
        default: false, // Mặc định là không ẩn phiên âm
    },
    flashcards: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FlashCard",
        },
    ],

    last_practice_date: {
        type: Date, // Lưu ngày luyện tập gần nhất để không luyện tập quá nhiều
        default: null,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
});

FlashCard = mongoose.model("FlashCard", FlashCardSchema);
ListFlashCard = mongoose.model("ListFlashCard", ListFlashCardSchema);

module.exports = { FlashCard, ListFlashCard };
