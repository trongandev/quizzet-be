const Chat = require("../models/Chat");

const Get = async (req, res) => {
    try {
        const { id } = req.user;
        const chats = await Chat.find({ participants: id }).populate("participants", "displayName profilePicture"); // Populate để hiển thị tên của người dùng

        const data_id = chats.map((chat) => chat.participants.filter((participant) => participant._id.toString() !== id.toString()).map((participant) => participant._id)).flat(); // Làm phẳng mảng nếu có nhiều chat

        res.status(200).json({ data_id, chats, ok: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const GetById = async (req, res) => {
    try {
        const { id } = req.params;
        const chats = await Chat.findById(id).populate("participants", "displayName profilePicture"); // Populate để hiển thị tên của người dùng
        res.status(200).json(chats);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const CheckRoomChat = async (req, res) => {
    try {
        const { idAnotherUser } = req.params;
        const { id } = req.user;
        const chat = await Chat.findOne({
            participants: { $all: [id, idAnotherUser] },
        });

        if (chat) {
            return res.status(200).json({ ok: true, chatId: chat._id, exists: true });
        } else {
            return res.status(200).json({ ok: true, exists: false });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const CreateChat = async (req, res) => {
    try {
        const { participants } = req.body;
        if (!participants || participants.length !== 2) {
            return res.status(400).json({ message: "Vui lòng cung cấp thông tin người tham gia" });
        }

        const newChat = new Chat({
            participants,
        });

        await newChat.save();
        res.status(201).json({ ok: true, message: "Tạo cuộc trò chuyện thành công", chat: newChat._id });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

const Update = async (req, res) => {
    try {
        const chatId = req.params.id;
        const { text } = req.body;
        const { id } = req.user;
        if (!text) {
            return res.status(400).json({ message: "Vui lòng cung cấp nội dung tin nhắn" });
        }

        const updatedChat = await Chat.findByIdAndUpdate(
            chatId,
            {
                $push: { messages: { sender: id, text, created_at: new Date() } }, // Thêm tin nhắn mới vào mảng messages
                last_message: text,
                last_message_date: new Date(),
            },
            { new: true }
        );

        if (!updatedChat) {
            return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện để cập nhật" });
        }
        const newMessage = updatedChat.messages[updatedChat.messages.length - 1];
        res.status(200).json({ message: "Gửi tin nhắn thành công", ok: true, newMessage });
    } catch (error) {
        console.log(error);
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
        console.log(error);
        res.status(500).json({ message: "Server gặp lỗi, vui lòng thử lại sau ít phút" });
    }
};

module.exports = {
    Get,
    GetById,
    CheckRoomChat,
    CreateChat,
    Update,
    Delete,
};
