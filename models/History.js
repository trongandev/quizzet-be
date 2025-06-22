const mongoose = require("mongoose");

const HistorySchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    quiz_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quiz",
    },
    date: {
        type: Date,
        default: Date.now,
    },
    score: {
        type: Number,
        required: true,
    },
    total_questions: {
        type: Number,
        required: true,
    },
    time: {
        type: Number,
        required: true,
    },
    userAnswers: {
        type: Map,
        of: String,
        required: true,
        // Ví dụ: {"1": "2", "2": "1", "3": "2", ...}
    },
});

module.exports = mongoose.model("History", HistorySchema);
