const { Chat, Message } = require("../models/Chat");

const Get = async (req, res) => {
    try {
        const { id } = req.user;
        const { page = 1, limit = 10 } = req.query; // Phân trang
        const skip = (page - 1) * limit;

        // Lấy danh sách chat
        const chats = await Chat.find({ "participants.userId": id })
            .populate("participants.userId", "displayName profilePicture") // Lấy thông tin người tham gia
            .sort({ last_message_date: -1 }) // Sắp xếp theo thời gian tin nhắn gần nhất
            .skip(skip)
            .limit(parseInt(limit))
            .select("participants last_message last_message_date is_read"); // Chỉ lấy các trường cần thiết

        // Đếm số lượng chưa đọc
        const unreadCount = await Chat.countDocuments({
            is_read: false,
        });

        res.status(200).json({ chats, ok: true, page, limit, unreadCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const GetById = async (req, res) => {
    try {
        const { id } = req.params;

        const chat = await Chat.findById(id).populate("participants.userId", "displayName profilePicture").populate("messages");

        if (!chat) {
            return res.status(404).json({ message: "Chat not found." });
        }

        res.status(200).json({
            ok: true,
            chat,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error. Please try again later." });
    }
};

const CreateChat = async (req, res) => {
    try {
        const { participants } = req.body;
        const { id } = req.user;
        if (!participants || participants.length !== 2 || !participants.includes(id)) {
            return res.status(400).json({ message: "Vui lòng cung cấp thông tin người tham gia hợp lệ" });
        }

        // Kiểm tra xem phòng chat đã tồn tại hay chưa
        const existingChat = await Chat.findOne({
            "participants.userId": { $all: participants },
        });

        if (existingChat) {
            return res.status(200).json({
                ok: true,
                message: "Phòng chat đã tồn tại",
                chatId: existingChat._id,
                exists: true,
            });
        }

        // Tạo phòng chat mới
        const newChat = new Chat({
            participants: participants.map((userId) => ({ userId })),
        });

        await newChat.save();
        res.status(201).json({
            ok: true,
            message: "Tạo cuộc trò chuyện thành công",
            chatId: newChat._id,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const Update = async (req, res) => {
    try {
        const { id: chatId } = req.params;
        const { message, image, userId, replyTo } = req.body;
        if (!message) {
            return res.status(400).json({ message: "Vui lòng cung cấp nội dung tin nhắn" });
        }

        const newMessage = new Message({
            userId,
            message: message || "",
            image: image || null,
            replyTo: replyTo || null,
        });
        await newMessage.save();

        // Cập nhật cuộc trò chuyện
        const updatedChat = await Chat.findByIdAndUpdate(
            chatId,
            {
                $push: { messages: newMessage._id }, // Thêm tin nhắn mới vào mảng
                last_message: message || "[Image]",
                last_message_date: new Date(),
            },
            { new: true }
        );

        if (!updatedChat) {
            return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện để cập nhật" });
        }

        res.status(200).json({
            message: "Gửi tin nhắn thành công",
            ok: true,
            newMessage,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const Delete = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedChat = await Chat.findByIdAndDelete(id);

        if (!deletedChat) {
            return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện để xóa" });
        }

        res.status(200).json({ message: "Xóa cuộc trò chuyện thành công" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

module.exports = {
    Get,
    GetById,
    CreateChat,
    Update,
    Delete,
};
