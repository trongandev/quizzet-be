const ChatCommunity = require("../models/ChatCommunity");

const getMessages = async (req, res) => {
    const { skip = 0, limit = 50 } = req.query;
    try {
        let chatCommunity = await ChatCommunity.findOne({ room: "community" }).populate("messages.userId", "displayName profilePicture");
        if (!chatCommunity) {
            return res.status(404).send("No messages found");
        }
        // Lấy ra 50 tin nhắn cuối cùng
        const totalMessages = chatCommunity.messages.length;
        const messages = chatCommunity.messages.slice(Math.max(totalMessages - skip - limit, 0), totalMessages - skip);
        res.status(200).send({ messages, hasMore: skip + limit < totalMessages });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const addMessage = async (req, res) => {
    const { userId, message, image } = req.body;
    const newMessage = { userId, message, image };

    try {
        let chatCommunity = await ChatCommunity.findOne({ room: "community" });
        if (!chatCommunity) {
            chatCommunity = new ChatCommunity();
        }

        chatCommunity.messages.push(newMessage);
        await chatCommunity.save();

        res.status(201).send(newMessage);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const addReaction = async (req, res) => {
    const { messageId, userId, emoji } = req.body;
    try {
        let chatCommunity = await ChatCommunity.findOne({ "messages._id": messageId });
        if (!chatCommunity) {
            return res.status(404).send("Message not found");
        }
        let message = chatCommunity.messages.id(messageId);
        message.reactions.push({ userId, emoji });
        await chatCommunity.save();
        res.status(200).send(message.reactions);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports = {
    getMessages,
    addReaction,
    addMessage,
};
