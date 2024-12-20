const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    message: String,
    image: String,
    timestamp: { type: Date, default: Date.now },
});

const ChatCommunitySchema = new mongoose.Schema({
    room: { type: String, default: "community" },
    messages: [messageSchema],
});

const ChatCommunity = mongoose.model("ChatCommunity", ChatCommunitySchema);

module.exports = ChatCommunity;
