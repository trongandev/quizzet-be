const { Message, ChatCommunity } = require("../models/Chat");
const CacheModel = require("../models/Cache");
const setCache = async (key, data, ttl = 3600) => {
    // lưu trữ trong 24 giờ
    const expireAt = new Date(Date.now() + ttl * 1000 * 24);
    await CacheModel.updateOne({ key }, { data: JSON.parse(JSON.stringify(data)), expireAt }, { upsert: true });
};

const getCache = async (key) => {
    const cachedData = await CacheModel.findOne({ key });
    return cachedData ? cachedData : null;
};

const deleteCache = async (key) => {
    await CacheModel.deleteOne({ key });
};

const getMessages = async (req, res) => {
    let { skip = 0, limit = 50 } = req.query;

    const cacheKey = `messages_${skip}_${limit}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
        return res.status(200).json(cachedData.data);
    }

    try {
        // Chuyển skip và limit sang số nguyên
        skip = Number(skip);
        limit = Number(limit);

        // Kiểm tra giá trị skip và limit
        if (isNaN(skip) || isNaN(limit) || skip < 0 || limit <= 0) {
            return res.status(400).json({ message: "Invalid skip or limit parameters" });
        }

        // Lấy thông tin phòng chat "community"
        const chatCommunity = await ChatCommunity.findOne({ room: "community" }).lean();

        // Tổng số tin nhắn trong phòng
        const totalMessages = chatCommunity.messages.length;

        // Tính toán số lượng tin nhắn còn lại
        const remainingMessages = totalMessages - skip;

        // Điều chỉnh limit nếu còn ít hơn
        if (remainingMessages < limit) {
            limit = remainingMessages;
        }

        // Lấy tin nhắn với skip và limit
        const messages = await Message.find({ _id: { $in: chatCommunity.messages } })
            .sort({ timestamp: -1 }) // Tin nhắn mới nhất trước
            .skip(skip)
            .limit(limit)
            .populate([
                { path: "sender", select: "_id displayName profilePicture" },
                {
                    path: "replyTo",
                    select: "text sender unsend image",
                    populate: { path: "sender", select: "_id displayName profilePicture" },
                },
                { path: "reactions.sender", select: "_id displayName profilePicture" },
            ])
            .lean();

        // Cache dữ liệu
        await setCache(cacheKey, { ok: true, messages, hasMore: skip + limit < totalMessages, remainingMessages });
        console.log(messages);
        res.status(200).json({
            ok: true,
            messages,
            hasMore: skip + limit < totalMessages, // Kiểm tra còn tin nhắn chưa load
            remainingMessages,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const addMessage = async (req, res) => {
    const { sender, text, image, replyTo } = req.body;
    try {
        // Tạo tin nhắn mới
        const newMessage = new Message({
            sender,
            text,
            image,
            replyTo, // Có thể null nếu không phải reply
        });
        // Lưu tin nhắn
        const savedMessage = await newMessage.save();

        // console.log("ádfd");
        // // Gắn tin nhắn vào phòng chat
        // const newRoom = new ChatCommunity({});
        // await newRoom.save();
        const findRoom = await ChatCommunity.findOneAndUpdate({ room: "community" }, { $push: { messages: savedMessage._id } }, { new: true, upsert: true });
        // if (!findRoom) {
        // }
        // Lấy lại tin nhắn vừa lưu và populate
        // const populatedMessage = await Message.findById(savedMessage._id).populate("userId", "_id displayName profilePicture").populate("replyTo");

        const populatedMessage = await Message.findById(savedMessage._id).populate([
            { path: "sender", select: "_id displayName profilePicture" }, // Populating User
            {
                path: "replyTo",
                select: "text sender unsend image",
                populate: { path: "sender", select: "_id displayName profilePicture" }, // Nested population for replyTo.userId
            },
        ]);

        await deleteCache("messages_0_50");

        res.status(201).send(populatedMessage);
    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
};

const addReaction = async (req, res) => {
    const { messageId, userId: sender, emoji } = req.body;
    console.log(req.body);
    try {
        // Tìm tin nhắn dựa trên `messageId`
        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ ok: false, message: "Tin nhắn không tồn tại" });
        }

        // Kiểm tra xem userId đã react chưa
        const existingReactionIndex = message.reactions.findIndex((reaction) => reaction.sender.toString() === sender.toString());

        if (existingReactionIndex !== -1) {
            // Nếu đã react
            if (message.reactions[existingReactionIndex].emoji === emoji) {
                // Nếu emoji giống nhau, xóa reaction
                message.reactions.splice(existingReactionIndex, 1);
            } else {
                // Nếu emoji khác nhau, cập nhật emoji
                message.reactions[existingReactionIndex].emoji = emoji;
            }
        } else {
            // Nếu chưa react, thêm reaction mới
            message.reactions.push({ sender, emoji });
        }

        // Lưu cập nhật vào DB
        await message.save();
        const updatedMessage = await Message.findById(messageId).populate("reactions.sender", "_id displayName profilePicture");
        await deleteCache("messages_0_50");
        res.status(200).json({ ok: true, reactions: updatedMessage.reactions });
    } catch (error) {
        console.error("Error in addReaction:", error);
        res.status(500).json({ ok: false, message: "Lỗi server" });
    }
};

const unsendMessage = async (req, res) => {
    const { messageId, sender } = req.body;

    try {
        const message = await Message.findOneAndUpdate({ _id: messageId, sender }, { $set: { unsend: true } }, { new: true });

        if (!message) {
            return res.status(404).json({ ok: false, message: "Tin nhắn không tồn tại hoặc bạn không có quyền xóa" });
        }
        await deleteCache("messages_0_50");

        res.status(200).json({ ok: true, message: "Gỡ tin nhắn thành công" });
    } catch (error) {
        console.log(error);

        res.status(500).send(error.message);
    }
};

const editMessage = async (req, res) => {
    const { messageId, sender, newMessage } = req.body;

    try {
        const result = await Message.findOneAndUpdate({ _id: messageId, sender }, { $set: { text: newMessage, isEdit: true } }, { new: true });

        if (!result) {
            return res.status(404).json({ ok: false, message: "Tin nhắn không tồn tại hoặc bạn không có quyền xóa" });
        }
        await deleteCache("messages_0_50");

        res.status(200).json({ ok: true, message: "Gỡ tin nhắn thành công" });
    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
};

module.exports = {
    getMessages,
    addReaction,
    addMessage,
    unsendMessage,
    editMessage,
};
