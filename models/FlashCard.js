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
            vi: String,
        },
    ],
    note: String,
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
    created_at: {
        type: Date,
        default: Date.now,
    },
});

FlashCard = mongoose.model("FlashCard", FlashCardSchema);
ListFlashCard = mongoose.model("ListFlashCard", ListFlashCardSchema);

module.exports = { FlashCard, ListFlashCard };
