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
    time: {
        type: Number,
        required: true,
    },
    questions: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DataHistory",
        required: true,
    },
});

const DataHistorySchema = new mongoose.Schema({
    data_history: {
        type: Array,
        required: true,
    },
});

module.exports = {
    HistoryModel: mongoose.model("History", HistorySchema),
    DataHistoryModel: mongoose.model("DataHistory", DataHistorySchema),
};
