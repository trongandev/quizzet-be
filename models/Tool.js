const mongoose = require("mongoose");

const ToolUserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
        min: 6,
    },
    status: {
        type: Boolean,
        default: true,
    },
    role: {
        type: String,
        default: "user",
    },
    failed_login_attempts: {
        type: Number,
        default: 0,
    },
    count_login: {
        type: Number,
        default: 1,
    },
    note: {
        type: String,
    },
    active_date: {
        type: Date,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
});

const ToolHistorySchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    header: {
        type: Array,
        required: true,
    },
    status: {
        type: Boolean,
        default: true, //thành công
    },
    count_login: {
        type: Number,
        default: 1,
    },
    subject: {
        type: String,
    },
    message: {
        type: String,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
});

module.exports = {
    ToolUserModel: mongoose.model("ToolUser", ToolUserSchema),
    ToolHistoryModel: mongoose.model("ToolHistory", ToolHistorySchema),
};
