const mongoose = require("mongoose");

const HistorySchema = new mongoose.Schema({
    uid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Liên kết tới User
        required: true,
    },
    id_quiz: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    image_quiz: {
        type: String,
    },
    date: {
        type: Date,
        default: Date.now, // Ngày tạo
    },
    score: {
        type: Number,
        required: true,
    },
    lenght: {
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
