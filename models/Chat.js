const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema({
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    messages: [
        {
            sender: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            text: {
                type: String,
                required: true,
            },
            created_at: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    last_message: {
        type: String,
    },
    last_message_date: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Chat", ChatSchema);
