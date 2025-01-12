const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    image: String,
    isEdit: {
        type: Boolean,
        default: false,
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: null,
    },
    unsend: {
        type: Boolean,
        default: false,
    },
    reactions: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            emoji: String,
        },
    ],
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const ChatSchema = new mongoose.Schema({
    participants: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        },
    ],
    messages: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
        },
    ],
    last_message: String,
    last_message_date: Date,
    is_read: {
        type: Boolean,
        default: false,
    },
});

const chatCommunitySchema = new mongoose.Schema({
    room: {
        type: String,
        default: "community",
        unique: true,
        index: true, // Index cho tìm kiếm nhanh hơn
    },
    messages: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
        },
    ],
});

module.exports = {
    ChatCommunity: mongoose.model("ChatCommunity", chatCommunitySchema),
    Chat: mongoose.model("Chat", ChatSchema),
    Message: mongoose.model("Message", MessageSchema),
};
