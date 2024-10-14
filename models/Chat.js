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
                default: new Date(),
            },
        },
    ],
    last_message: {
        type: String,
    },
    last_message_date: {
        type: Date,
        default: new Date(),
    },
});

module.exports = mongoose.model("Chat", ChatSchema);
