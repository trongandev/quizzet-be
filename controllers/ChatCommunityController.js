const { Message, ChatCommunity } = require("../models/ChatCommunity");

const getMessages = async (req, res) => {
    const { skip = 0, limit = 50 } = req.query;

    try {
        // Lấy phòng chat
        const chatCommunity = await ChatCommunity.findOne({ room: "community" }).populate({
            path: "messages",
            populate: [
                { path: "userId", select: "displayName profilePicture" }, // Populating User
                { path: "replyTo", select: "message userId", populate: { path: "userId", select: "displayName" } }, // Populating replyTo
            ],
        });

        if (!chatCommunity) {
            return res.status(404).send("No messages found");
        }

        // Lấy tin nhắn theo giới hạn và skip
        const totalMessages = chatCommunity.messages.length;
        const messages = chatCommunity.messages.slice(Math.max(totalMessages - skip - limit, 0), totalMessages - skip);

        res.status(200).send({ messages, hasMore: skip + limit < totalMessages });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const addMessage = async (req, res) => {
    const { userId, message, image, replyTo } = req.body;

    try {
        // Tạo tin nhắn mới
        const newMessage = new Message({
            userId,
            message,
            image,
            replyTo, // Có thể null nếu không phải reply
        });

        // Lưu tin nhắn
        await newMessage.save();

        // Gắn tin nhắn vào phòng chat
        const chatCommunity = await ChatCommunity.findOneAndUpdate({ room: "community" }, { $push: { messages: newMessage._id } }, { new: true, upsert: true });

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
