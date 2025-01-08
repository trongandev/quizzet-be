const mongoose = require("mongoose");

const FlashCardSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true, // Bắt buộc phải có tiêu đề
        trim: true, // Loại bỏ khoảng trắng thừa ở đầu/cuối
    },
    define: {
        type: String,
        required: true, // Bắt buộc phải có định nghĩa
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
    status: {
        type: String,
        enum: ["learned", "remembered", "reviewing"], // Các trạng thái của từ
        default: "reviewing", // Mặc định là cần ôn tập
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
            result: {
                type: Boolean, // Kết quả đúng/sai
                required: true,
            },
        },
    ],
    created_at: {
        type: Date,
        default: Date.now,
    },
});

const ListFlashCardSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
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
    flashcards: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FlashCard",
        },
    ],
    progress: {
        totalCards: {
            type: Number,
            default: 0, // Tổng số flashcard trong danh sách
        },
        rememberedCards: {
            type: Number,
            default: 0, // Số flashcard đã nhớ
        },
        percentage: {
            type: Number,
            default: 0, // % thuộc của cả danh sách
        },
    },
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
